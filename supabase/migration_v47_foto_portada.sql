-- Ejecutar en el SQL Editor de Supabase después de migration_v46_fix_function_overloads.sql.
--
-- La portada (tarjeta 4:3) y el detalle (4:5) de una publicación
-- compartían un solo recorte — la tarjeta era una vista derivada
-- (object-cover) del mismo recorte del detalle, sin control propio de
-- zoom/posición. Se agrega foto_portada_url para que sean dos recortes
-- independientes, elegidos en dos pasos separados desde el editor.
--
-- foto_url (detalle, 4:5) y foto_og_url (recorte 1.91:1 para compartir,
-- derivado de foto_url) no cambian.

alter table public.listings add column if not exists foto_portada_url text;

-- Mismo patrón que migration_v46: "create or replace function" con una
-- lista de parámetros distinta NO reemplaza la función existente en
-- Postgres, crea un overload nuevo y deja la vieja viva — hay que
-- borrar todas las versiones acumuladas de estas 3 funciones antes de
-- volver a crearlas, para no repetir el bug que arregló v46.
do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('crear_borrador', 'mi_update_listing', 'admin_update_listing')
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
  p_foto_og_url text default null,
  p_foto_portada_url text default null
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
    precio_regalo, whatsapp_publico, foto_og_url, foto_portada_url, status
  ) values (
    auth.uid(), p_intencion, p_tipo, p_categoria, p_subcategoria, coalesce(p_zona, ''), p_cuadrante, p_direccion,
    coalesce(p_nombre, ''), p_subtitulo, coalesce(p_descripcion, ''), p_foto_url, coalesce(p_modalidad, '{}'), coalesce(p_tags, '{}'),
    coalesce(p_etiquetas, '{}'), p_precio, coalesce(p_precio_a_consultar, false), coalesce(p_precio_regalo, false),
    coalesce(p_whatsapp_publico, false), p_foto_og_url, p_foto_portada_url, 'borrador'
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
  p_foto_og_url text default null,
  p_foto_portada_url text default null
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
    foto_portada_url = coalesce(p_foto_portada_url, foto_portada_url),
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
  p_foto_portada_url text default null
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
    foto_portada_url = coalesce(p_foto_portada_url, foto_portada_url),
    updated_at = now()
  where id = p_listing_id;

  insert into public.moderacion_log (entity_type, entity_id, actor_id, accion, detalle)
  values ('listing', p_listing_id, auth.uid(), 'edicion', p_nota);
end;
$$;

grant execute on function public.crear_borrador(text, text, text, text, text, text, text, text, text, text, text, text[], text[], text[], numeric, boolean, boolean, boolean, text, text) to authenticated;
grant execute on function public.mi_update_listing(uuid, text, text, text, text, text, numeric, boolean, boolean, text, text[], text[], int, jsonb, text, text, text, boolean, text, text) to authenticated;
grant execute on function public.admin_update_listing(uuid, text, text, text, text, text, numeric, boolean, boolean, text, text[], text[], int, jsonb, text, text, text, text, boolean, text, text) to authenticated;
