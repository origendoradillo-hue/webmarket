-- Ejecutar en el SQL Editor de Supabase después de las migraciones anteriores.
-- Soporte de flyers verticales en anuncios: layout configurable, orientación
-- de imagen, imagen de fondo separada, y CTA (antes no existía ningún botón
-- de acción en el carrusel).

alter table public.anuncios add column if not exists layout_type text
  not null default 'full_banner'
  check (layout_type in ('flyer_on_sign', 'full_banner', 'text_only', 'background_image'));

alter table public.anuncios add column if not exists image_orientation text
  check (image_orientation in ('vertical', 'horizontal', 'square'));

alter table public.anuncios add column if not exists background_image_url text;

alter table public.anuncios add column if not exists cta_label text;

alter table public.anuncios add column if not exists cta_url text;

-- Se agregan parámetros nuevos al final, todos con default null: no cambia
-- ningún parámetro existente, así que no hace falta un "drop function" como
-- en migration_v16 (esa vez sí se había reordenado/quitado un parámetro).
create or replace function public.admin_process_anuncio(
  p_anuncio_id uuid,
  p_status text default null,
  p_titulo text default null,
  p_descripcion text default null,
  p_imagen_url text default null,
  p_fecha_evento timestamptz default null,
  p_lugar text default null,
  p_orden int default null,
  p_nota text default null,
  p_ubicacion text default null,
  p_layout_type text default null,
  p_image_orientation text default null,
  p_background_image_url text default null,
  p_cta_label text default null,
  p_cta_url text default null
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
  if p_ubicacion is not null and p_ubicacion not in ('home', 'categoria', 'ambas') then
    raise exception 'Ubicación inválida';
  end if;
  if p_layout_type is not null and p_layout_type not in
    ('flyer_on_sign', 'full_banner', 'text_only', 'background_image') then
    raise exception 'Layout inválido';
  end if;
  if p_image_orientation is not null and p_image_orientation not in ('vertical', 'horizontal', 'square') then
    raise exception 'Orientación inválida';
  end if;

  update public.anuncios set
    status = coalesce(p_status, status),
    titulo = coalesce(p_titulo, titulo),
    descripcion = coalesce(p_descripcion, descripcion),
    imagen_url = coalesce(p_imagen_url, imagen_url),
    fecha_evento = coalesce(p_fecha_evento, fecha_evento),
    lugar = coalesce(p_lugar, lugar),
    orden = coalesce(p_orden, orden),
    ubicacion = coalesce(p_ubicacion, ubicacion),
    layout_type = coalesce(p_layout_type, layout_type),
    image_orientation = coalesce(p_image_orientation, image_orientation),
    background_image_url = coalesce(p_background_image_url, background_image_url),
    cta_label = coalesce(p_cta_label, cta_label),
    cta_url = coalesce(p_cta_url, cta_url),
    updated_at = now()
  where id = p_anuncio_id;

  insert into public.moderacion_log (entity_type, entity_id, actor_id, accion, detalle)
  values ('anuncio', p_anuncio_id, auth.uid(), 'edicion', p_nota);
end;
$$;
