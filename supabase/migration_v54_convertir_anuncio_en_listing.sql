-- Ejecutar en el SQL Editor de Supabase después de migration_v53_avatar_perfil.sql.
--
-- El sentido inverso de admin_convertir_listing_en_anuncio (migration_v31):
-- hay usuarios que piden un anuncio sin entender la diferencia con una
-- publicación normal ("se ofrece") — esto le permite al staff convertir esa
-- solicitud de anuncio en un borrador de publicación, copiando
-- título/descripción/foto, para que el usuario (o el staff) lo termine de
-- completar con los datos que le faltan (zona, categoría, tipo, precio...).

create function public.admin_convertir_anuncio_en_listing(
  p_anuncio_id uuid,
  p_tipo text default null,
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
    v_anuncio.solicitante_id, 'ofrezco', p_tipo, p_categoria, '', v_anuncio.titulo, v_anuncio.descripcion, v_anuncio.imagen_url, 'borrador'
  )
  returning id into v_listing_id;

  insert into public.moderacion_log (entity_type, entity_id, actor_id, accion, detalle)
  values ('listing', v_listing_id, auth.uid(), 'creado_desde_anuncio', p_anuncio_id::text);

  return v_listing_id;
end;
$$;

grant execute on function public.admin_convertir_anuncio_en_listing(uuid, text, text) to authenticated;
