-- Ejecutar en el SQL Editor de Supabase después de migration_v45_anuncio_tipo_editable.sql.
--
-- Bug reportado: el panel de anuncios empezó a tirar
-- "Could not choose the best candidate function between:
-- public.admin_process_anuncio(...), public.admin_process_anuncio(...)".
--
-- Causa: en Postgres, "create or replace function" solo reemplaza una
-- función existente si el NOMBRE y la LISTA DE TIPOS de parámetros son
-- idénticos. Cada vez que una migración de esta sesión le agregó un
-- parámetro nuevo al final (con default) a una función ya existente
-- (p_foto_og_url en migration_v43, p_whatsapp_numero y p_tipo en
-- migration_v44/v45 de admin_process_anuncio), Postgres NO reemplazó la
-- versión anterior — creó una función sobrecargada (overload) nueva y
-- dejó la vieja viva al lado. Con varias versiones acumuladas, un
-- llamado que no manda los parámetros nuevos queda ambiguo entre cuál
-- de las versiones usar, y Postgres tira ese error en vez de elegir.
--
-- Esta migración borra TODAS las versiones acumuladas de las 4 funciones
-- que fueron creciendo así esta sesión (buscándolas dinámicamente por
-- nombre, sin asumir sus firmas viejas exactas) y las vuelve a crear,
-- una sola vez cada una, con su versión vigente.

do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('crear_borrador', 'mi_update_listing', 'admin_update_listing', 'admin_process_anuncio')
  loop
    execute format('drop function %s', r.sig);
  end loop;
end $$;

create function public.crear_borrador(
  p_intencion text,
  p_tipo text default null,
  p_categoria text default null,
  p_subcategoria text default null,
  p_zona text default null,
  p_cuadrante text default null,
  p_direccion text default null,
  p_nombre text default null,
  p_subtitulo text default null,
  p_descripcion text default null,
  p_foto_url text default null,
  p_modalidad text[] default null,
  p_tags text[] default null,
  p_etiquetas text[] default null,
  p_precio numeric default null,
  p_precio_a_consultar boolean default null,
  p_precio_regalo boolean default null,
  p_whatsapp_publico boolean default null,
  p_foto_og_url text default null
)
returns uuid
language plpgsql
security definer set search_path = ''
as $$
declare
  v_id uuid;
begin
  insert into public.listings (
    publisher_id, intencion, tipo, categoria, subcategoria, zona, cuadrante, direccion,
    nombre, subtitulo, descripcion, foto_url, modalidad, tags, etiquetas, precio, precio_a_consultar,
    precio_regalo, whatsapp_publico, foto_og_url, status
  ) values (
    auth.uid(), p_intencion, p_tipo, p_categoria, p_subcategoria, coalesce(p_zona, ''), p_cuadrante, p_direccion,
    coalesce(p_nombre, ''), p_subtitulo, coalesce(p_descripcion, ''), p_foto_url, coalesce(p_modalidad, '{}'), coalesce(p_tags, '{}'),
    coalesce(p_etiquetas, '{}'), p_precio, coalesce(p_precio_a_consultar, false), coalesce(p_precio_regalo, false),
    coalesce(p_whatsapp_publico, false), p_foto_og_url, 'borrador'
  )
  returning id into v_id;
  return v_id;
end;
$$;

create function public.mi_update_listing(
  p_listing_id uuid,
  p_nombre text default null,
  p_subtitulo text default null,
  p_descripcion text default null,
  p_categoria text default null,
  p_subcategoria text default null,
  p_precio numeric default null,
  p_precio_a_consultar boolean default null,
  p_precio_regalo boolean default null,
  p_foto_url text default null,
  p_modalidad text[] default null,
  p_tags text[] default null,
  p_cantidad int default null,
  p_detalles jsonb default null,
  p_zona text default null,
  p_cuadrante text default null,
  p_direccion text default null,
  p_whatsapp_publico boolean default null,
  p_foto_og_url text default null
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
    subtitulo = coalesce(p_subtitulo, subtitulo),
    descripcion = coalesce(p_descripcion, descripcion),
    categoria = coalesce(p_categoria, categoria),
    subcategoria = coalesce(p_subcategoria, subcategoria),
    precio = coalesce(p_precio, precio),
    precio_a_consultar = coalesce(p_precio_a_consultar, precio_a_consultar),
    precio_regalo = coalesce(p_precio_regalo, precio_regalo),
    foto_url = coalesce(p_foto_url, foto_url),
    modalidad = coalesce(p_modalidad, modalidad),
    tags = coalesce(p_tags, tags),
    cantidad = coalesce(p_cantidad, cantidad),
    detalles = coalesce(p_detalles, detalles),
    zona = coalesce(p_zona, zona),
    cuadrante = coalesce(p_cuadrante, cuadrante),
    direccion = coalesce(p_direccion, direccion),
    whatsapp_publico = coalesce(p_whatsapp_publico, whatsapp_publico),
    foto_og_url = coalesce(p_foto_og_url, foto_og_url),
    updated_at = now()
  where id = p_listing_id;
end;
$$;

create function public.admin_update_listing(
  p_listing_id uuid,
  p_nombre text default null,
  p_subtitulo text default null,
  p_descripcion text default null,
  p_categoria text default null,
  p_subcategoria text default null,
  p_precio numeric default null,
  p_precio_a_consultar boolean default null,
  p_precio_regalo boolean default null,
  p_foto_url text default null,
  p_modalidad text[] default null,
  p_tags text[] default null,
  p_cantidad int default null,
  p_detalles jsonb default null,
  p_zona text default null,
  p_cuadrante text default null,
  p_direccion text default null,
  p_nota text default null,
  p_whatsapp_publico boolean default null,
  p_foto_og_url text default null
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
    subtitulo = coalesce(p_subtitulo, subtitulo),
    descripcion = coalesce(p_descripcion, descripcion),
    categoria = coalesce(p_categoria, categoria),
    subcategoria = coalesce(p_subcategoria, subcategoria),
    precio = coalesce(p_precio, precio),
    precio_a_consultar = coalesce(p_precio_a_consultar, precio_a_consultar),
    precio_regalo = coalesce(p_precio_regalo, precio_regalo),
    foto_url = coalesce(p_foto_url, foto_url),
    modalidad = coalesce(p_modalidad, modalidad),
    tags = coalesce(p_tags, tags),
    cantidad = coalesce(p_cantidad, cantidad),
    detalles = coalesce(p_detalles, detalles),
    zona = coalesce(p_zona, zona),
    cuadrante = coalesce(p_cuadrante, cuadrante),
    direccion = coalesce(p_direccion, direccion),
    whatsapp_publico = coalesce(p_whatsapp_publico, whatsapp_publico),
    foto_og_url = coalesce(p_foto_og_url, foto_og_url),
    updated_at = now()
  where id = p_listing_id;

  insert into public.moderacion_log (entity_type, entity_id, actor_id, accion, detalle)
  values ('listing', p_listing_id, auth.uid(), 'edicion', p_nota);
end;
$$;

create function public.admin_process_anuncio(
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
  p_cta_url text default null,
  p_whatsapp_numero text default null,
  p_tipo text default null
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
  if p_tipo is not null and p_tipo not in
    ('evento', 'aviso_barrial', 'sponsor', 'promocion', 'comunicado', 'feria', 'novedad') then
    raise exception 'Tipo inválido';
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
    whatsapp_numero = coalesce(p_whatsapp_numero, whatsapp_numero),
    tipo = coalesce(p_tipo, tipo),
    updated_at = now()
  where id = p_anuncio_id;

  insert into public.moderacion_log (entity_type, entity_id, actor_id, accion, detalle)
  values ('anuncio', p_anuncio_id, auth.uid(), 'edicion', p_nota);
end;
$$;

-- Los permisos de ejecución sobre funciones se otorgan a "authenticated"
-- por default en este proyecto al crearlas — como acá se borraron y se
-- volvieron a crear desde cero, se reafirman explícitamente por las dudas.
grant execute on function public.crear_borrador(text, text, text, text, text, text, text, text, text, text, text, text[], text[], text[], numeric, boolean, boolean, boolean, text) to authenticated;
grant execute on function public.mi_update_listing(uuid, text, text, text, text, text, numeric, boolean, boolean, text, text[], text[], int, jsonb, text, text, text, boolean, text) to authenticated;
grant execute on function public.admin_update_listing(uuid, text, text, text, text, text, numeric, boolean, boolean, text, text[], text[], int, jsonb, text, text, text, text, boolean, text) to authenticated;
grant execute on function public.admin_process_anuncio(uuid, text, text, text, text, timestamptz, text, int, text, text, text, text, text, text, text, text, text) to authenticated;
