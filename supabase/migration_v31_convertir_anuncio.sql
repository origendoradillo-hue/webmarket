-- Ejecutar en el SQL Editor de Supabase después de migration_v30_taxonomia.sql.
-- Permite a staff convertir una publicación (listing) en un anuncio
-- editorial, copiando nombre/descripción/foto como punto de partida. La
-- policy de insert de anuncios (migration_v2_arquitectura.sql) solo deja
-- insertar con status='solicitado' y solicitante_id=auth.uid(), así que
-- esto necesita un RPC security definer, igual que el resto de las
-- acciones de staff sobre anuncios.

create function public.admin_convertir_listing_en_anuncio(
  p_listing_id uuid,
  p_tipo text default 'promocion',
  p_cta_url text default null,
  p_cta_label text default null
)
returns uuid
language plpgsql
security definer set search_path = ''
as $$
declare
  v_listing record;
  v_anuncio_id uuid;
begin
  if not public.is_staff(auth.uid()) then
    raise exception 'No autorizado';
  end if;
  if p_tipo not in ('evento', 'aviso_barrial', 'sponsor', 'promocion', 'comunicado', 'feria', 'novedad') then
    raise exception 'Tipo inválido';
  end if;

  select nombre, descripcion, foto_url, publisher_id into v_listing
  from public.listings where id = p_listing_id;

  if not found then
    raise exception 'Publicación no encontrada';
  end if;

  insert into public.anuncios (
    tipo, titulo, descripcion, imagen_url, solicitante_id, status, cta_url, cta_label
  ) values (
    p_tipo, v_listing.nombre, v_listing.descripcion, v_listing.foto_url, v_listing.publisher_id, 'aprobado',
    p_cta_url, p_cta_label
  )
  returning id into v_anuncio_id;

  insert into public.moderacion_log (entity_type, entity_id, actor_id, accion, detalle)
  values ('anuncio', v_anuncio_id, auth.uid(), 'creado_desde_publicacion', p_listing_id::text);

  return v_anuncio_id;
end;
$$;

grant execute on function public.admin_convertir_listing_en_anuncio to authenticated;
