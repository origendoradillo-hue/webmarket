-- Ejecutar en el SQL Editor de Supabase después de migration_v33_eliminar_anuncio.sql.
-- Bug: el contador de vistas de una publicación y el de visitas al sitio
-- sumaban también las visitas de moderadores/admins/superadmin navegando
-- para revisar contenido, inflando las métricas reales. Se excluyen
-- sesiones de staff en ambos casos (no cambia la firma de ninguna función,
-- "create or replace" alcanza).

create or replace function public.registrar_vista(p_listing_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  v_publisher_id uuid;
begin
  if public.is_staff(auth.uid()) then
    return;
  end if;
  select publisher_id into v_publisher_id from public.listings where id = p_listing_id;
  if v_publisher_id is null then
    return;
  end if;
  if v_publisher_id = auth.uid() then
    return;
  end if;
  update public.listings set views_count = views_count + 1 where id = p_listing_id;
end;
$$;

create or replace function public.registrar_visita_sitio()
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if public.is_staff(auth.uid()) then
    return;
  end if;
  insert into public.site_visits default values;
end;
$$;
