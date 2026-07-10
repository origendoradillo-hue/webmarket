-- Ejecutar en el SQL Editor de Supabase después de migration_v32_convertir_pausa_original.sql.
-- Bug: en el admin existe "Eliminar publicación definitivamente" para
-- listings (admin_delete_listing, migration_v10) pero no hay equivalente
-- para anuncios. Mismo patrón: solo superadmin, deja constancia en
-- moderacion_log antes de borrar.

create function public.admin_delete_anuncio(p_anuncio_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if not public.is_superadmin(auth.uid()) then
    raise exception 'No autorizado';
  end if;
  insert into public.moderacion_log (entity_type, entity_id, actor_id, accion, detalle)
  values ('anuncio', p_anuncio_id, auth.uid(), 'eliminado_permanente', null);
  delete from public.anuncios where id = p_anuncio_id;
end;
$$;

grant execute on function public.admin_delete_anuncio to authenticated;
