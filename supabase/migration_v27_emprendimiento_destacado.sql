-- Ejecutar en el SQL Editor de Supabase después de las migraciones anteriores.
-- Nueva marca "emprendimiento destacado", separada de "destacada" (que ya
-- existe para cualquier publicación) — mismo patrón que admin_set_destacada.
alter table public.listings add column if not exists emprendimiento_destacado boolean not null default false;

create function public.admin_set_emprendimiento_destacado(p_listing_id uuid, p_value boolean)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if not public.is_staff(auth.uid()) then
    raise exception 'No autorizado';
  end if;
  update public.listings set emprendimiento_destacado = p_value, updated_at = now() where id = p_listing_id;
  insert into public.moderacion_log (entity_type, entity_id, actor_id, accion, detalle)
  values ('listing', p_listing_id, auth.uid(), 'emprendimiento_destacado', p_value::text);
end;
$$;
