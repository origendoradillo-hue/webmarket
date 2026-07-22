-- Ejecutar en el SQL Editor de Supabase después de migration_v42_permiso_redes_sociales.sql.
--
-- Bug reportado: al compartir el link de una publicación por WhatsApp,
-- no siempre se ve la foto en la vista previa. Confirmado con dos
-- publicaciones reales: la foto es muy vertical (ej. 1131x1600), lejos
-- del 1.91:1 que esperan los crawlers de WhatsApp/Facebook para el
-- og:image — con ese desvío el crawler suele descartar la imagen y no
-- mostrar nada.
--
-- Se agrega foto_og_url: un recorte centrado en 1.91:1, generado en el
-- navegador (lib/cropForShare.ts) solo para la vista previa al
-- compartir — la foto original se sigue mostrando completa, sin recortar,
-- dentro de la publicación. Si una fila no tiene foto_og_url (publicada
-- antes de este cambio), generateMetadata cae a un logo de marca en vez
-- de arriesgarse a la foto sin recortar.

alter table public.listings add column if not exists foto_og_url text;

create or replace function public.crear_borrador(
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

create or replace function public.mi_update_listing(
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

create or replace function public.admin_update_listing(
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
