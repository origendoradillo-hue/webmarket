-- Ejecutar en el SQL Editor de Supabase después de migration_v54_convertir_anuncio_en_listing.sql.
--
-- Hasta ahora no había forma de borrar la foto principal de una
-- publicación ni las imágenes de un anuncio — solo se podían
-- reemplazar. "coalesce(p_x, x)" no alcanza para esto: pasar NULL
-- significa "dejar como está", no "borrar". Por eso cada campo de foto
-- que se puede borrar gana un flag booleano propio (mismo patrón que
-- p_quitar_precio_anterior en migration_v50).
--
-- Al borrar la foto principal de una publicación también se borran
-- foto_og_url y foto_portada_url, porque ambas son recortes derivados
-- de esa misma foto — dejarlas sueltas mostraría una imagen vieja en
-- el link para compartir o en la tarjeta aunque el detalle ya no
-- tenga foto.

-- Mismo patrón que v46/v47/v48/v50: "create or replace function" con
-- una lista de parámetros distinta no reemplaza la función existente
-- en Postgres, crea un overload nuevo y deja la vieja viva — hay que
-- borrar todas las versiones acumuladas antes de recrearlas.
do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('mi_update_listing', 'admin_update_listing', 'admin_process_anuncio')
  loop
    execute format('drop function %s', r.sig);
  end loop;
end $$;

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
  p_foto_og_url text default null,
  p_foto_portada_url text default null,
  p_nombre_emprendimiento text default null,
  p_precio_anterior numeric default null,
  p_quitar_precio_anterior boolean default false,
  p_quitar_foto boolean default false
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
    foto_url = case when p_quitar_foto then null else coalesce(p_foto_url, foto_url) end,
    modalidad = coalesce(p_modalidad, modalidad),
    tags = coalesce(p_tags, tags),
    cantidad = coalesce(p_cantidad, cantidad),
    detalles = coalesce(p_detalles, detalles),
    zona = coalesce(p_zona, zona),
    cuadrante = coalesce(p_cuadrante, cuadrante),
    direccion = coalesce(p_direccion, direccion),
    whatsapp_publico = coalesce(p_whatsapp_publico, whatsapp_publico),
    foto_og_url = case when p_quitar_foto then null else coalesce(p_foto_og_url, foto_og_url) end,
    foto_portada_url = case when p_quitar_foto then null else coalesce(p_foto_portada_url, foto_portada_url) end,
    nombre_emprendimiento = coalesce(p_nombre_emprendimiento, nombre_emprendimiento),
    precio_anterior = case when p_quitar_precio_anterior then null else coalesce(p_precio_anterior, precio_anterior) end,
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
  p_foto_og_url text default null,
  p_foto_portada_url text default null,
  p_nombre_emprendimiento text default null,
  p_precio_anterior numeric default null,
  p_quitar_precio_anterior boolean default false,
  p_quitar_foto boolean default false
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
    foto_url = case when p_quitar_foto then null else coalesce(p_foto_url, foto_url) end,
    modalidad = coalesce(p_modalidad, modalidad),
    tags = coalesce(p_tags, tags),
    cantidad = coalesce(p_cantidad, cantidad),
    detalles = coalesce(p_detalles, detalles),
    zona = coalesce(p_zona, zona),
    cuadrante = coalesce(p_cuadrante, cuadrante),
    direccion = coalesce(p_direccion, direccion),
    whatsapp_publico = coalesce(p_whatsapp_publico, whatsapp_publico),
    foto_og_url = case when p_quitar_foto then null else coalesce(p_foto_og_url, foto_og_url) end,
    foto_portada_url = case when p_quitar_foto then null else coalesce(p_foto_portada_url, foto_portada_url) end,
    nombre_emprendimiento = coalesce(p_nombre_emprendimiento, nombre_emprendimiento),
    precio_anterior = case when p_quitar_precio_anterior then null else coalesce(p_precio_anterior, precio_anterior) end,
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
    ('flyer_on_sign', 'full_banner', 'text_only', 'background_image') then
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

grant execute on function public.mi_update_listing(uuid, text, text, text, text, text, numeric, boolean, boolean, text, text[], text[], int, jsonb, text, text, text, boolean, text, text, text, numeric, boolean, boolean) to authenticated;
grant execute on function public.admin_update_listing(uuid, text, text, text, text, text, numeric, boolean, boolean, text, text[], text[], int, jsonb, text, text, text, text, boolean, text, text, text, numeric, boolean, boolean) to authenticated;
grant execute on function public.admin_process_anuncio(uuid, text, text, text, text, timestamptz, text, int, text, text, text, text, text, text, text, text, text, boolean, boolean) to authenticated;
