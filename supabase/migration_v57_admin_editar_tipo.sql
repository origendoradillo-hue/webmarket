-- Ejecutar en el SQL Editor de Supabase después de migration_v56_optimizar_anuncios.sql.
--
-- El panel de admin mostraba el "tipo" de una publicación (producto,
-- servicio, inmueble, automotor, usado, emprendimiento, otro) como texto
-- fijo, sin ninguna forma de cambiarlo — y como las categorías están
-- filtradas por tipo (tipo_scope), una publicación vieja cargada con un
-- tipo genérico como "otro" solo puede elegir entre la única categoría
-- que tiene tipo_scope=otro ("Varios"), aunque en realidad correspondería
-- a otro tipo con categorías más específicas. Sin poder editar el tipo,
-- esas publicaciones quedan atascadas mostrando "todas las categorías
-- faltan".
--
-- Agrega p_tipo a admin_update_listing — cambia la lista de parámetros,
-- así que hace falta el mismo patrón drop-loop de siempre.
do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'admin_update_listing'
  loop
    execute format('drop function %s', r.sig);
  end loop;
end $$;

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
  p_quitar_foto boolean default false,
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

  update public.listings set
    nombre = coalesce(p_nombre, nombre),
    subtitulo = coalesce(p_subtitulo, subtitulo),
    descripcion = coalesce(p_descripcion, descripcion),
    tipo = coalesce(p_tipo, tipo),
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

grant execute on function public.admin_update_listing(uuid, text, text, text, text, text, numeric, boolean, boolean, text, text[], text[], int, jsonb, text, text, text, text, boolean, text, text, text, numeric, boolean, boolean, text) to authenticated;
