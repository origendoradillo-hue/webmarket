-- Ejecutar en el SQL Editor de Supabase después de las migraciones anteriores.
-- Etapa 5: capacidades exclusivas de superadmin — reasignar publicaciones y
-- editar cualquier perfil. Bloquear/desbloquear usuarios ya existe
-- (admin_set_blocked, migration_v4_auth.sql).

create function public.admin_reassign_listing(p_listing_id uuid, p_new_publisher_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  v_caller_role text;
begin
  select role into v_caller_role from public.profiles where id = auth.uid();
  if v_caller_role is distinct from 'superadmin' then
    raise exception 'No autorizado';
  end if;
  update public.listings set publisher_id = p_new_publisher_id, updated_at = now() where id = p_listing_id;
  insert into public.moderacion_log (entity_type, entity_id, actor_id, accion, detalle)
  values ('listing', p_listing_id, auth.uid(), 'reasignada', p_new_publisher_id::text);
end;
$$;

create function public.admin_update_profile(p_user_id uuid, p_full_name text default null, p_whatsapp_number text default null)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  v_caller_role text;
begin
  select role into v_caller_role from public.profiles where id = auth.uid();
  if v_caller_role is distinct from 'superadmin' then
    raise exception 'No autorizado';
  end if;
  update public.profiles set
    full_name = coalesce(p_full_name, full_name),
    whatsapp_number = coalesce(p_whatsapp_number, whatsapp_number)
  where id = p_user_id;
end;
$$;
