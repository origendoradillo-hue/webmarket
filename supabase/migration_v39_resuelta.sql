-- Ejecutar en el SQL Editor de Supabase después de migration_v38_resenas_editar.sql.
-- Nuevo estado "resuelta": marcar una publicación como vendida/resuelta
-- sin borrarla, para conservar el historial (a diferencia de "eliminada").
-- La etiqueta que ve el vecino varía según intención ("Vendida" para
-- ofrezco, "Resuelta" para busco) — eso es solo texto de UI, la base
-- guarda un único valor de estado.

alter table public.listings drop constraint if exists listings_status_check;
alter table public.listings add constraint listings_status_check
  check (status in ('borrador', 'en_revision', 'activa', 'observada', 'rechazada', 'pausada', 'vencida', 'eliminada', 'resuelta'));

create or replace function public.mi_set_listing_status(p_listing_id uuid, p_status text)
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
  if p_status not in ('activa', 'pausada', 'eliminada', 'resuelta') then
    raise exception 'Estado inválido';
  end if;
  update public.listings set status = p_status, updated_at = now() where id = p_listing_id;
  insert into public.moderacion_log (entity_type, entity_id, actor_id, accion, detalle)
  values ('listing', p_listing_id, auth.uid(), 'cambio_estado_propio', p_status);
end;
$$;

create or replace function public.admin_set_listing_status(p_listing_id uuid, p_status text, p_nota text default null)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if not public.is_staff(auth.uid()) then
    raise exception 'No autorizado';
  end if;
  if p_status not in ('borrador', 'en_revision', 'activa', 'observada', 'rechazada', 'pausada', 'vencida', 'eliminada', 'resuelta') then
    raise exception 'Estado inválido';
  end if;
  update public.listings set status = p_status, updated_at = now() where id = p_listing_id;
  insert into public.moderacion_log (entity_type, entity_id, actor_id, accion, detalle)
  values ('listing', p_listing_id, auth.uid(), 'cambio_estado', coalesce(p_nota, p_status));
end;
$$;
