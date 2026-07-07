-- Ejecutar en el SQL Editor de Supabase después de las migraciones anteriores.
-- Correcciones encontradas en la revisión de código de las Etapas 9-15.

-- 1) El denunciado nunca podía ver ni responder una denuncia sobre su propia
-- publicación: la única policy de SELECT era "reporter_id = auth.uid() o
-- staff", y responder_denuncia (migration_v17) se agregó sin sumar el
-- permiso de lectura correspondiente. MyListingsModal.tsx consulta la tabla
-- directo (no por RPC), así que sin esta policy siempre recibía cero filas.
create policy "Denunciado ve las denuncias sobre sus publicaciones"
  on public.listing_reports for select
  to authenticated
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_reports.listing_id and l.publisher_id = auth.uid()
    )
  );

-- 2) admin_set_blocked no validaba p_user_id: si reporter_id es null (la
-- cuenta del denunciante fue borrada), "suspender a ambos" ejecutaba un
-- update sin filas afectadas, sin avisar del error.
create or replace function public.admin_set_blocked(p_user_id uuid, p_blocked boolean)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  v_caller_role text;
begin
  if p_user_id is null then
    raise exception 'Usuario inválido';
  end if;
  select role into v_caller_role from public.profiles where id = auth.uid();
  if v_caller_role is distinct from 'superadmin' then
    raise exception 'No autorizado';
  end if;
  if auth.uid() = p_user_id then
    raise exception 'No podés bloquearte a vos mismo';
  end if;
  update public.profiles
    set blocked_at = case when p_blocked then now() else null end
    where id = p_user_id;
end;
$$;
