-- Ejecutar en el SQL Editor de Supabase después de migration_v40_notificaciones.sql.
-- Últimas dos ideas del roadmap: mensajería admin↔publicador (visible
-- para ambos, a diferencia de la nota interna que es solo para staff) y
-- alerta de búsqueda por categoría. Ambas reusan el sistema de
-- notificaciones ya armado, solo se amplía el check de "tipo".

alter table public.notificaciones drop constraint if exists notificaciones_tipo_check;
alter table public.notificaciones add constraint notificaciones_tipo_check
  check (tipo in ('contacto', 'pregunta_nueva', 'pregunta_respondida', 'aprobada', 'observada', 'mensaje_moderacion', 'alerta_categoria'));

-- 1) Mensajería admin↔publicador ---------------------------------------

create table public.mensajes_moderacion (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  autor_id uuid references public.profiles (id) on delete set null,
  es_staff boolean not null,
  mensaje text not null,
  created_at timestamptz not null default now()
);

alter table public.mensajes_moderacion enable row level security;

create policy "El publicador de la publicación y el staff ven el hilo"
  on public.mensajes_moderacion for select
  to authenticated
  using (
    exists (select 1 from public.listings l where l.id = listing_id and l.publisher_id = auth.uid())
    or public.is_staff(auth.uid())
  );

revoke insert, update, delete on public.mensajes_moderacion from authenticated, anon;

create function public.enviar_mensaje_moderacion(p_listing_id uuid, p_mensaje text)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  v_publisher_id uuid;
  v_es_staff boolean;
begin
  select publisher_id into v_publisher_id from public.listings where id = p_listing_id;
  if v_publisher_id is null then
    raise exception 'Publicación no encontrada';
  end if;

  v_es_staff := public.is_staff(auth.uid());
  if not v_es_staff and v_publisher_id is distinct from auth.uid() then
    raise exception 'No autorizado';
  end if;
  if btrim(coalesce(p_mensaje, '')) = '' then
    raise exception 'Escribí un mensaje';
  end if;

  insert into public.mensajes_moderacion (listing_id, autor_id, es_staff, mensaje)
  values (p_listing_id, auth.uid(), v_es_staff, btrim(p_mensaje));
end;
$$;

grant execute on function public.enviar_mensaje_moderacion to authenticated;

create function public.trg_notificar_mensaje_moderacion()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  v_publisher_id uuid;
  v_nombre text;
begin
  if new.es_staff then
    select publisher_id, nombre into v_publisher_id, v_nombre from public.listings where id = new.listing_id;
    if v_publisher_id is not null then
      insert into public.notificaciones (user_id, tipo, listing_id, mensaje)
      values (v_publisher_id, 'mensaje_moderacion', new.listing_id, 'Tenés un mensaje del equipo de Origen sobre "' || coalesce(v_nombre, 'tu publicación') || '"');
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists on_mensaje_moderacion_notify on public.mensajes_moderacion;
create trigger on_mensaje_moderacion_notify
  after insert on public.mensajes_moderacion
  for each row execute procedure public.trg_notificar_mensaje_moderacion();

-- 2) Alerta de búsqueda por categoría ------------------------------------

create table public.alertas_categoria (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  categoria text not null,
  created_at timestamptz not null default now(),
  unique (user_id, categoria)
);

alter table public.alertas_categoria enable row level security;

create policy "Cada uno administra sus propias alertas"
  on public.alertas_categoria for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create function public.trg_notificar_alerta_categoria()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  v_sub record;
begin
  if new.categoria is null then
    return new;
  end if;
  for v_sub in
    select user_id from public.alertas_categoria
    where categoria = new.categoria and user_id is distinct from new.publisher_id
  loop
    insert into public.notificaciones (user_id, tipo, listing_id, mensaje)
    values (v_sub.user_id, 'alerta_categoria', new.id, 'Nueva publicación en una categoría que seguís: "' || new.nombre || '"');
  end loop;
  return new;
end;
$$;

drop trigger if exists on_listing_insert_alerta on public.listings;
create trigger on_listing_insert_alerta
  after insert on public.listings
  for each row when (new.status = 'activa')
  execute procedure public.trg_notificar_alerta_categoria();

drop trigger if exists on_listing_status_alerta on public.listings;
create trigger on_listing_status_alerta
  after update of status on public.listings
  for each row when (new.status = 'activa' and old.status is distinct from 'activa')
  execute procedure public.trg_notificar_alerta_categoria();
