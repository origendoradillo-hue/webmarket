-- Ejecutar en el SQL Editor de Supabase después de schema.sql, migration_rol.sql
-- y migration_admin.sql. Reestructura Publicaciones vs Anuncios.

-- ============================================================
-- 1) LISTINGS (Publicaciones): intencion en vez de tipo_aviso,
--    columna tipo nueva, estados simplificados, campos nuevos.
-- ============================================================

alter table public.listings rename column tipo_aviso to intencion;
alter table public.listings drop constraint if exists listings_tipo_aviso_check;

update public.listings set intencion = case intencion
  when 'oferta' then 'ofrezco'
  when 'demanda' then 'busco'
  else intencion
end;

-- Los eventos salen de Publicaciones (pasan a ser Anuncios).
delete from public.listings where intencion = 'evento';

alter table public.listings add constraint listings_intencion_check
  check (intencion in ('ofrezco', 'busco'));

-- Tipo (Producto/Servicio/Experiencia/Inmueble/Usado o herramienta/Otro):
-- gobierna foto/precio/dirección/campos extra. Solo aplica a "ofrezco";
-- "busco" no lo necesita (es su propia lógica, sin distinguir producto de
-- servicio).
alter table public.listings add column tipo text
  check (tipo in ('producto', 'servicio', 'experiencia', 'inmueble', 'usado_herramienta', 'otro'));

update public.listings set tipo = 'producto' where tipo is null and intencion = 'ofrezco';

alter table public.listings add constraint listings_tipo_requerido_check
  check ((intencion = 'ofrezco' and tipo is not null) or (intencion = 'busco'));

-- Categoría/subcategoría ahora opcionales: "otro" no fuerza rubro, y
-- "usado_herramienta" usa su propio pseudo-rubro "usados" con subrubros
-- propios (Herramientas, Electrodomésticos, Materiales de construcción,
-- Muebles, Otros usados) en vez de las 7 categorías de siempre.
alter table public.listings alter column categoria drop not null;
alter table public.listings alter column subcategoria drop not null;

-- Estados: se simplifica drásticamente. Las Publicaciones se publican al
-- instante (sin cola de revisión previa); la moderación es posterior.
alter table public.listings drop constraint if exists listings_status_check;

update public.listings set status = case status
  when 'publicada' then 'activa'
  when 'en_revision' then 'activa'
  when 'borrador' then 'activa'
  when 'pausada' then 'pausada'
  when 'vencida' then 'vencida'
  when 'eliminada' then 'eliminada'
  else 'eliminada'
end;

alter table public.listings add constraint listings_status_check
  check (status in ('activa', 'pausada', 'vencida', 'eliminada'));
alter table public.listings alter column status set default 'activa';

-- Campos nuevos.
alter table public.listings add column precio numeric;
alter table public.listings add column precio_a_consultar boolean not null default false;
alter table public.listings add column sello boolean not null default false;
alter table public.listings add column destacada boolean not null default false;
alter table public.listings add column detalles jsonb not null default '{}';
alter table public.listings add column expires_at timestamptz;

-- Las Publicaciones se publican solas: se cambia el INSERT para forzar
-- status='activa' (antes forzaba 'en_revision').
drop policy if exists "Usuarios autenticados crean publicaciones a su nombre" on public.listings;
create policy "Usuarios autenticados crean publicaciones a su nombre"
  on public.listings for insert
  to authenticated
  with check (auth.uid() = publisher_id and status = 'activa');

drop policy if exists "Cualquiera puede ver publicaciones publicadas" on public.listings;
create policy "Cualquiera puede ver publicaciones activas"
  on public.listings for select
  to anon, authenticated
  using (status = 'activa');

-- ============================================================
-- 2) ANUNCIOS: editorial, siempre a través del admin.
-- ============================================================

create table public.anuncios (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('evento', 'aviso_barrial', 'sponsor', 'promocion', 'comunicado', 'feria', 'novedad')),
  titulo text not null,
  descripcion text not null,
  imagen_url text,
  fecha_evento timestamptz,
  lugar text,
  solicitante_id uuid references public.profiles (id),
  status text not null default 'solicitado'
    check (status in ('solicitado', 'en_conversacion', 'aprobado', 'programado', 'publicado', 'pausado', 'vencido', 'rechazado')),
  orden int not null default 0,
  notas_internas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.anuncios enable row level security;

create policy "Cualquiera ve anuncios publicados"
  on public.anuncios for select
  to anon, authenticated
  using (status = 'publicado');

create policy "Staff ve todos los anuncios"
  on public.anuncios for select
  to authenticated
  using (public.is_staff(auth.uid()));

create policy "Usuarios autenticados solicitan anuncios"
  on public.anuncios for insert
  to authenticated
  with check (auth.uid() = solicitante_id and status = 'solicitado');

-- ============================================================
-- 3) MODERACION_LOG: historial + notas internas (no público).
-- ============================================================

create table public.moderacion_log (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('listing', 'anuncio')),
  entity_id uuid not null,
  actor_id uuid references public.profiles (id),
  accion text not null,
  detalle text,
  created_at timestamptz not null default now()
);

alter table public.moderacion_log enable row level security;

create policy "Solo el staff lee el historial"
  on public.moderacion_log for select
  to authenticated
  using (public.is_staff(auth.uid()));

-- ============================================================
-- 4) FUNCIONES
-- ============================================================

-- Reemplaza a la vieja admin_update_listing_status (estados distintos).
drop function if exists public.admin_update_listing_status(uuid, text);

create function public.admin_set_listing_status(p_listing_id uuid, p_status text, p_nota text default null)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if not public.is_staff(auth.uid()) then
    raise exception 'No autorizado';
  end if;
  if p_status not in ('activa', 'pausada', 'vencida', 'eliminada') then
    raise exception 'Estado inválido';
  end if;
  update public.listings set status = p_status, updated_at = now() where id = p_listing_id;
  insert into public.moderacion_log (entity_type, entity_id, actor_id, accion, detalle)
  values ('listing', p_listing_id, auth.uid(), 'cambio_estado', coalesce(p_nota, p_status));
end;
$$;

create function public.admin_set_sello(p_listing_id uuid, p_value boolean)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if not public.is_staff(auth.uid()) then
    raise exception 'No autorizado';
  end if;
  update public.listings set sello = p_value, updated_at = now() where id = p_listing_id;
  insert into public.moderacion_log (entity_type, entity_id, actor_id, accion, detalle)
  values ('listing', p_listing_id, auth.uid(), 'sello', p_value::text);
end;
$$;

create function public.admin_set_destacada(p_listing_id uuid, p_value boolean)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if not public.is_staff(auth.uid()) then
    raise exception 'No autorizado';
  end if;
  update public.listings set destacada = p_value, updated_at = now() where id = p_listing_id;
  insert into public.moderacion_log (entity_type, entity_id, actor_id, accion, detalle)
  values ('listing', p_listing_id, auth.uid(), 'destacada', p_value::text);
end;
$$;

create function public.admin_add_nota(p_entity_type text, p_entity_id uuid, p_nota text)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if not public.is_staff(auth.uid()) then
    raise exception 'No autorizado';
  end if;
  if p_entity_type not in ('listing', 'anuncio') then
    raise exception 'Tipo de entidad inválido';
  end if;
  insert into public.moderacion_log (entity_type, entity_id, actor_id, accion, detalle)
  values (p_entity_type, p_entity_id, auth.uid(), 'nota', p_nota);
end;
$$;

-- Edición completa de una publicación por parte del staff (incluye poder
-- cargar/reemplazar la foto en nombre del vecino). Los parámetros en null
-- significan "no tocar este campo".
create function public.admin_update_listing(
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
  p_direccion text default null,
  p_nota text default null
)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if not public.is_staff(auth.uid()) then
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

  insert into public.moderacion_log (entity_type, entity_id, actor_id, accion, detalle)
  values ('listing', p_listing_id, auth.uid(), 'edicion', p_nota);
end;
$$;

-- Un usuario autenticado solicita un Anuncio (evento, aviso, sponsor...).
-- Queda "solicitado" hasta que el admin lo procese a mano.
create function public.solicitar_anuncio(
  p_tipo text,
  p_titulo text,
  p_descripcion text,
  p_imagen_url text default null,
  p_fecha_evento timestamptz default null,
  p_lugar text default null
)
returns uuid
language plpgsql
security definer set search_path = ''
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Debés iniciar sesión';
  end if;
  insert into public.anuncios (tipo, titulo, descripcion, imagen_url, fecha_evento, lugar, solicitante_id, status)
  values (p_tipo, p_titulo, p_descripcion, p_imagen_url, p_fecha_evento, p_lugar, auth.uid(), 'solicitado')
  returning id into v_id;
  return v_id;
end;
$$;

-- El admin edita/aprueba/rechaza un anuncio (incluye publicarlo).
create function public.admin_process_anuncio(
  p_anuncio_id uuid,
  p_status text default null,
  p_titulo text default null,
  p_descripcion text default null,
  p_imagen_url text default null,
  p_fecha_evento timestamptz default null,
  p_lugar text default null,
  p_orden int default null,
  p_nota text default null
)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if not public.is_staff(auth.uid()) then
    raise exception 'No autorizado';
  end if;
  if p_status is not null and p_status not in
    ('solicitado', 'en_conversacion', 'aprobado', 'programado', 'publicado', 'pausado', 'vencido', 'rechazado') then
    raise exception 'Estado inválido';
  end if;

  update public.anuncios set
    status = coalesce(p_status, status),
    titulo = coalesce(p_titulo, titulo),
    descripcion = coalesce(p_descripcion, descripcion),
    imagen_url = coalesce(p_imagen_url, imagen_url),
    fecha_evento = coalesce(p_fecha_evento, fecha_evento),
    lugar = coalesce(p_lugar, lugar),
    orden = coalesce(p_orden, orden),
    updated_at = now()
  where id = p_anuncio_id;

  insert into public.moderacion_log (entity_type, entity_id, actor_id, accion, detalle)
  values ('anuncio', p_anuncio_id, auth.uid(), 'edicion', p_nota);
end;
$$;

-- contactar_publicacion ahora chequea 'activa' en vez de 'publicada'.
create or replace function public.contactar_publicacion(p_listing_id uuid)
returns text
language plpgsql
security definer set search_path = ''
as $$
declare
  v_whatsapp text;
begin
  if auth.uid() is null then
    raise exception 'Debés iniciar sesión para contactar por WhatsApp';
  end if;

  select pr.whatsapp_number into v_whatsapp
  from public.listings l
  join public.profiles pr on pr.id = l.publisher_id
  where l.id = p_listing_id and l.status = 'activa';

  if v_whatsapp is null then
    raise exception 'Publicación no encontrada';
  end if;

  insert into public.whatsapp_clicks (listing_id, clicked_by) values (p_listing_id, auth.uid());

  return v_whatsapp;
end;
$$;
