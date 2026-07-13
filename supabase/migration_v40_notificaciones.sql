-- Ejecutar en el SQL Editor de Supabase después de migration_v39_resuelta.sql.
-- Notificaciones de perfil: contacto recibido, pregunta nueva/respondida,
-- publicación aprobada/observada. "Vence pronto" no se guarda acá — se
-- calcula al vuelo en el front a partir de expires_at, mismo criterio que
-- expire_old_listings() (no es un evento discreto, es un estado).

create table public.notificaciones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  tipo text not null check (tipo in ('contacto', 'pregunta_nueva', 'pregunta_respondida', 'aprobada', 'observada')),
  listing_id uuid references public.listings (id) on delete cascade,
  mensaje text not null,
  leida boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notificaciones enable row level security;

create policy "Cada uno ve solo sus notificaciones"
  on public.notificaciones for select
  to authenticated
  using (user_id = auth.uid());

revoke insert, update, delete on public.notificaciones from authenticated, anon;

create function public.marcar_notificaciones_leidas()
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  update public.notificaciones set leida = true where user_id = auth.uid() and leida = false;
end;
$$;

grant execute on function public.marcar_notificaciones_leidas to authenticated;

-- Contacto: un clic de WhatsApp notifica al publicador de esa publicación.
create function public.trg_notificar_contacto()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  v_publisher_id uuid;
  v_nombre text;
begin
  select publisher_id, nombre into v_publisher_id, v_nombre from public.listings where id = new.listing_id;
  if v_publisher_id is not null and v_publisher_id is distinct from new.clicked_by then
    insert into public.notificaciones (user_id, tipo, listing_id, mensaje)
    values (v_publisher_id, 'contacto', new.listing_id, 'Te contactaron por "' || coalesce(v_nombre, 'tu publicación') || '"');
  end if;
  return new;
end;
$$;

drop trigger if exists on_whatsapp_click_notify on public.whatsapp_clicks;
create trigger on_whatsapp_click_notify
  after insert on public.whatsapp_clicks
  for each row execute procedure public.trg_notificar_contacto();

-- Pregunta nueva: notifica al publicador.
create function public.trg_notificar_pregunta_nueva()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  v_publisher_id uuid;
  v_nombre text;
begin
  select publisher_id, nombre into v_publisher_id, v_nombre from public.listings where id = new.listing_id;
  if v_publisher_id is not null then
    insert into public.notificaciones (user_id, tipo, listing_id, mensaje)
    values (v_publisher_id, 'pregunta_nueva', new.listing_id, 'Tenés una pregunta nueva en "' || coalesce(v_nombre, 'tu publicación') || '"');
  end if;
  return new;
end;
$$;

drop trigger if exists on_question_insert_notify on public.listing_questions;
create trigger on_question_insert_notify
  after insert on public.listing_questions
  for each row execute procedure public.trg_notificar_pregunta_nueva();

-- Pregunta respondida: notifica a quien preguntó.
create function public.trg_notificar_pregunta_respondida()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  v_nombre text;
begin
  if new.respuesta is not null and old.respuesta is null and new.asker_id is not null then
    select nombre into v_nombre from public.listings where id = new.listing_id;
    insert into public.notificaciones (user_id, tipo, listing_id, mensaje)
    values (new.asker_id, 'pregunta_respondida', new.listing_id, 'Te respondieron tu pregunta en "' || coalesce(v_nombre, 'una publicación') || '"');
  end if;
  return new;
end;
$$;

drop trigger if exists on_question_update_notify on public.listing_questions;
create trigger on_question_update_notify
  after update on public.listing_questions
  for each row execute procedure public.trg_notificar_pregunta_respondida();

-- Aprobada / observada: cambio de estado de la publicación.
create function public.trg_notificar_cambio_estado()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if old.status = 'en_revision' and new.status = 'activa' then
    insert into public.notificaciones (user_id, tipo, listing_id, mensaje)
    values (new.publisher_id, 'aprobada', new.id, 'Tu publicación "' || new.nombre || '" fue aprobada');
  elsif new.status = 'observada' and old.status is distinct from 'observada' then
    insert into public.notificaciones (user_id, tipo, listing_id, mensaje)
    values (new.publisher_id, 'observada', new.id, 'Tu publicación "' || new.nombre || '" fue observada — revisá los comentarios del admin');
  end if;
  return new;
end;
$$;

drop trigger if exists on_listing_status_notify on public.listings;
create trigger on_listing_status_notify
  after update of status on public.listings
  for each row execute procedure public.trg_notificar_cambio_estado();
