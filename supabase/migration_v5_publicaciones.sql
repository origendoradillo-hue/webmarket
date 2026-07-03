-- Ejecutar en el SQL Editor de Supabase después de las migraciones anteriores.
-- Etapa 3: publicaciones administrables por el usuario (multi-foto, panel
-- "mis publicaciones", estados ampliados).

-- 1) Ampliar los estados de listings a los 8 pedidos. La publicación sigue
--    siendo instantánea por defecto (la policy de insert de más abajo sigue
--    forzando status='activa' al crear) — los estados nuevos
--    (en_revision/observada/rechazada/borrador) quedan disponibles para que
--    el staff los use en casos puntuales (denuncias, verificación reforzada),
--    no como paso obligatorio de todas las publicaciones.
alter table public.listings drop constraint if exists listings_status_check;
alter table public.listings add constraint listings_status_check
  check (status in ('borrador', 'en_revision', 'activa', 'observada', 'rechazada', 'pausada', 'vencida', 'eliminada'));

-- 2) El dueño de una publicación ahora puede verla sin importar su estado
--    (antes solo se veían las 'activa' vía la policy pública). No toca la
--    policy pública existente.
create policy "Dueño ve sus propias publicaciones sin importar el estado"
  on public.listings for select
  to authenticated
  using (auth.uid() = publisher_id);

-- 3) Autoservicio: pausar / reactivar / eliminar la propia publicación.
--    Deliberadamente NO permite pasar a en_revision/observada/rechazada —
--    esos son estados de moderación, los pone el staff.
create function public.mi_set_listing_status(p_listing_id uuid, p_status text)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  v_owner uuid;
begin
  select publisher_id into v_owner from public.listings where id = p_listing_id;
  if v_owner is distinct from auth.uid() then
    raise exception 'No autorizado';
  end if;
  if p_status not in ('activa', 'pausada', 'eliminada') then
    raise exception 'Estado inválido';
  end if;
  update public.listings set status = p_status, updated_at = now() where id = p_listing_id;
  insert into public.moderacion_log (entity_type, entity_id, actor_id, accion, detalle)
  values ('listing', p_listing_id, auth.uid(), 'cambio_estado_propio', p_status);
end;
$$;

-- 4) Autoservicio: editar los campos propios (mismo set que
--    admin_update_listing, pero verificando dueño en vez de is_staff()).
create function public.mi_update_listing(
  p_listing_id uuid,
  p_nombre text default null,
  p_descripcion text default null,
  p_categoria text default null,
  p_subcategoria text default null,
  p_precio numeric default null,
  p_precio_a_consultar boolean default null,
  p_foto_url text default null,
  p_modalidad text[] default null,
  p_tags text[] default null,
  p_cantidad int default null,
  p_detalles jsonb default null,
  p_zona text default null,
  p_cuadrante text default null,
  p_direccion text default null
)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  v_owner uuid;
begin
  select publisher_id into v_owner from public.listings where id = p_listing_id;
  if v_owner is distinct from auth.uid() then
    raise exception 'No autorizado';
  end if;

  update public.listings set
    nombre = coalesce(p_nombre, nombre),
    descripcion = coalesce(p_descripcion, descripcion),
    categoria = coalesce(p_categoria, categoria),
    subcategoria = coalesce(p_subcategoria, subcategoria),
    precio = coalesce(p_precio, precio),
    precio_a_consultar = coalesce(p_precio_a_consultar, precio_a_consultar),
    foto_url = coalesce(p_foto_url, foto_url),
    modalidad = coalesce(p_modalidad, modalidad),
    tags = coalesce(p_tags, tags),
    cantidad = coalesce(p_cantidad, cantidad),
    detalles = coalesce(p_detalles, detalles),
    zona = coalesce(p_zona, zona),
    cuadrante = coalesce(p_cuadrante, cuadrante),
    direccion = coalesce(p_direccion, direccion),
    updated_at = now()
  where id = p_listing_id;
end;
$$;

-- 5) admin_set_listing_status ahora acepta los 8 estados (antes solo 4).
create or replace function public.admin_set_listing_status(p_listing_id uuid, p_status text, p_nota text default null)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if not public.is_staff(auth.uid()) then
    raise exception 'No autorizado';
  end if;
  if p_status not in ('borrador', 'en_revision', 'activa', 'observada', 'rechazada', 'pausada', 'vencida', 'eliminada') then
    raise exception 'Estado inválido';
  end if;
  update public.listings set status = p_status, updated_at = now() where id = p_listing_id;
  insert into public.moderacion_log (entity_type, entity_id, actor_id, accion, detalle)
  values ('listing', p_listing_id, auth.uid(), 'cambio_estado', coalesce(p_nota, p_status));
end;
$$;

-- 6) Multi-foto: listing_images guarda fotos adicionales. foto_url sigue
--    siendo la portada (no se toca esa columna ni el resto del front que ya
--    la usa para tarjetas/grillas).
create table public.listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  url text not null,
  orden int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.listing_images enable row level security;

create policy "Ve fotos de publicaciones visibles"
  on public.listing_images for select
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id
        and (l.status = 'activa' or l.publisher_id = auth.uid() or public.is_staff(auth.uid()))
    )
  );

create policy "Dueño agrega fotos a su publicación"
  on public.listing_images for insert
  to authenticated
  with check (exists (select 1 from public.listings where id = listing_id and publisher_id = auth.uid()));

create policy "Dueño borra fotos de su publicación"
  on public.listing_images for delete
  to authenticated
  using (exists (select 1 from public.listings where id = listing_id and publisher_id = auth.uid()));

create policy "Staff administra fotos de cualquier publicación"
  on public.listing_images for all
  to authenticated
  using (public.is_staff(auth.uid()));
