-- Ejecutar en el SQL Editor de Supabase después de migration_v55_quitar_foto.sql.
--
-- Dos cosas en esta migración, ninguna cambia la lista de parámetros de
-- ninguna función (solo defaults y cuerpo) — no hace falta el patrón
-- drop-loop de otras migraciones, "create or replace function" alcanza.

-- 1) admin_convertir_anuncio_en_listing insertaba p_tipo (default null)
-- directo en listings.tipo, que es not null — el botón "Convertir en
-- publicación" no tiene ningún selector para elegir un tipo, así que
-- siempre rompía con "null value in column tipo". El resultado es un
-- borrador (status='borrador') que el staff termina de completar de
-- todos modos, así que 'otro' es un default seguro — mismo criterio que
-- ya usa la función inversa (admin_convertir_listing_en_anuncio, que
-- defaultea p_tipo a 'promocion').
create or replace function public.admin_convertir_anuncio_en_listing(
  p_anuncio_id uuid,
  p_tipo text default 'otro',
  p_categoria text default null
)
returns uuid
language plpgsql
security definer set search_path = ''
as $$
declare
  v_anuncio record;
  v_listing_id uuid;
begin
  if not public.is_staff(auth.uid()) then
    raise exception 'No autorizado';
  end if;

  select titulo, descripcion, imagen_url, solicitante_id into v_anuncio
  from public.anuncios where id = p_anuncio_id;

  if not found then
    raise exception 'Anuncio no encontrado';
  end if;
  if v_anuncio.solicitante_id is null then
    raise exception 'Este anuncio no tiene un usuario asociado, no se puede convertir';
  end if;

  insert into public.listings (
    publisher_id, intencion, tipo, categoria, zona, nombre, descripcion, foto_url, status
  ) values (
    v_anuncio.solicitante_id, 'ofrezco', coalesce(p_tipo, 'otro'), p_categoria, '', v_anuncio.titulo, v_anuncio.descripcion, v_anuncio.imagen_url, 'borrador'
  )
  returning id into v_listing_id;

  insert into public.moderacion_log (entity_type, entity_id, actor_id, accion, detalle)
  values ('listing', v_listing_id, auth.uid(), 'creado_desde_anuncio', p_anuncio_id::text);

  return v_listing_id;
end;
$$;

-- 2) "Banner horizontal completo" e "Imagen de fondo + placa de texto"
-- terminaron viéndose casi idénticos en la práctica (misma foto de
-- fondo, texto superpuesto con blur) — se fusionan en un solo layout,
-- que se queda con la clave 'full_banner'. Los anuncios existentes con
-- layout_type='background_image' pasan a 'full_banner' (el componente
-- ya usa background_image_url como fuente preferida de foto en ese
-- layout, así que no pierden su imagen).
update public.anuncios set layout_type = 'full_banner' where layout_type = 'background_image';

alter table public.anuncios drop constraint if exists anuncios_layout_type_check;
alter table public.anuncios add constraint anuncios_layout_type_check
  check (layout_type in ('flyer_on_sign', 'full_banner', 'text_only'));

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
  p_background_image_url text default null,
  p_cta_label text default null,
  p_cta_url text default null,
  p_whatsapp_numero text default null,
  p_tipo text default null,
  p_redes_url text default null,
  p_quitar_imagen boolean default false,
  p_quitar_background_image boolean default false
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
    ('flyer_on_sign', 'full_banner', 'text_only') then
    raise exception 'Layout inválido';
  end if;
  if p_tipo is not null and p_tipo not in
    ('evento', 'aviso_barrial', 'sponsor', 'promocion', 'comunicado', 'feria', 'novedad') then
    raise exception 'Tipo inválido';
  end if;

  update public.anuncios set
    status = coalesce(p_status, status),
    titulo = coalesce(p_titulo, titulo),
    descripcion = coalesce(p_descripcion, descripcion),
    imagen_url = case when p_quitar_imagen then null else coalesce(p_imagen_url, imagen_url) end,
    fecha_evento = coalesce(p_fecha_evento, fecha_evento),
    lugar = coalesce(p_lugar, lugar),
    orden = coalesce(p_orden, orden),
    ubicacion = coalesce(p_ubicacion, ubicacion),
    layout_type = coalesce(p_layout_type, layout_type),
    background_image_url = case when p_quitar_background_image then null else coalesce(p_background_image_url, background_image_url) end,
    cta_label = coalesce(p_cta_label, cta_label),
    cta_url = coalesce(p_cta_url, cta_url),
    whatsapp_numero = coalesce(p_whatsapp_numero, whatsapp_numero),
    tipo = coalesce(p_tipo, tipo),
    redes_url = coalesce(p_redes_url, redes_url),
    updated_at = now()
  where id = p_anuncio_id;

  insert into public.moderacion_log (entity_type, entity_id, actor_id, accion, detalle)
  values ('anuncio', p_anuncio_id, auth.uid(), 'edicion', p_nota);
end;
$$;

create or replace function public.solicitar_anuncio(
  p_tipo text,
  p_titulo text,
  p_descripcion text,
  p_imagen_url text default null,
  p_fecha_evento timestamptz default null,
  p_lugar text default null,
  p_layout_type text default null,
  p_background_image_url text default null,
  p_cta_label text default null,
  p_cta_url text default null,
  p_whatsapp_numero text default null,
  p_redes_url text default null,
  p_mensaje_solicitante text default null
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
  if p_layout_type is not null and p_layout_type not in
    ('flyer_on_sign', 'full_banner', 'text_only') then
    raise exception 'Layout inválido';
  end if;

  insert into public.anuncios (
    tipo, titulo, descripcion, imagen_url, fecha_evento, lugar,
    layout_type, background_image_url, cta_label, cta_url, whatsapp_numero, redes_url,
    mensaje_solicitante, solicitante_id, status
  )
  values (
    p_tipo, p_titulo, p_descripcion, p_imagen_url, p_fecha_evento, p_lugar,
    coalesce(p_layout_type, 'full_banner'), p_background_image_url, p_cta_label, p_cta_url, p_whatsapp_numero, p_redes_url,
    p_mensaje_solicitante, auth.uid(), 'solicitado'
  )
  returning id into v_id;
  return v_id;
end;
$$;

grant execute on function public.admin_convertir_anuncio_en_listing(uuid, text, text) to authenticated;
grant execute on function public.admin_process_anuncio(uuid, text, text, text, text, timestamptz, text, int, text, text, text, text, text, text, text, text, text, boolean, boolean) to authenticated;
grant execute on function public.solicitar_anuncio(text, text, text, text, timestamptz, text, text, text, text, text, text, text, text) to authenticated;
