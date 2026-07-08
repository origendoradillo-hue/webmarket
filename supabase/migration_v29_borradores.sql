-- Ejecutar en el SQL Editor de Supabase después de migration_v28_favoritos.sql.
-- Etapa 7 del plan de pendientes: guardar una publicación a medio completar
-- como borrador, para retomarla después.

-- La policy de insert de listings (migration_v2_arquitectura.sql) exige
-- status = 'activa' en cualquier insert directo del cliente, así que un
-- borrador ('borrador' sigue siendo un valor válido de status desde
-- migration_v5_publicaciones.sql) necesita pasar por un RPC security
-- definer, igual que el resto de las escrituras sensibles de este proyecto.
create function public.crear_borrador(
  p_intencion text,
  p_tipo text default null,
  p_categoria text default null,
  p_subcategoria text default null,
  p_zona text default null,
  p_cuadrante text default null,
  p_direccion text default null,
  p_nombre text default null,
  p_descripcion text default null,
  p_foto_url text default null,
  p_modalidad text[] default null,
  p_tags text[] default null,
  p_etiquetas text[] default null,
  p_precio numeric default null,
  p_precio_a_consultar boolean default null,
  p_whatsapp_publico boolean default null
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
    nombre, descripcion, foto_url, modalidad, tags, etiquetas, precio, precio_a_consultar,
    whatsapp_publico, status
  ) values (
    auth.uid(), p_intencion, p_tipo, p_categoria, p_subcategoria, coalesce(p_zona, ''), p_cuadrante, p_direccion,
    coalesce(p_nombre, ''), coalesce(p_descripcion, ''), p_foto_url, coalesce(p_modalidad, '{}'), coalesce(p_tags, '{}'),
    coalesce(p_etiquetas, '{}'), p_precio, coalesce(p_precio_a_consultar, false),
    coalesce(p_whatsapp_publico, false), 'borrador'
  )
  returning id into v_id;
  return v_id;
end;
$$;

grant execute on function public.crear_borrador to authenticated;
