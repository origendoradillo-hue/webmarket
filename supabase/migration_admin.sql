-- Ejecutar en el SQL Editor de Supabase después de schema.sql y migration_rol.sql.
-- Agrega lo necesario para el panel de administrador básico.

-- Guardamos el email en el perfil para poder identificar usuarios en el
-- panel sin necesitar acceso administrativo especial a auth.users.
alter table public.profiles add column email text;

update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id and p.email is null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, whatsapp_number, email)
  values (new.id, new.phone, new.email);
  return new;
end;
$$;

-- Chequea si un usuario es moderador/administrador/superadmin.
create function public.is_staff(uid uuid)
returns boolean
language sql
security definer set search_path = ''
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = uid and role in ('moderador', 'administrador', 'superadmin')
  );
$$;

-- El staff puede ver TODAS las publicaciones, no solo las publicadas.
create policy "Staff ve todas las publicaciones"
  on public.listings for select
  to authenticated
  using (public.is_staff(auth.uid()));

-- Aprobar / rechazar / pausar / eliminar una publicación (cualquiera, no solo la propia).
create function public.admin_update_listing_status(p_listing_id uuid, p_status text)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if not public.is_staff(auth.uid()) then
    raise exception 'No autorizado';
  end if;
  if p_status not in ('borrador','en_revision','publicada','observada','rechazada','pausada','vencida','eliminada') then
    raise exception 'Estado inválido';
  end if;
  update public.listings set status = p_status, updated_at = now() where id = p_listing_id;
end;
$$;

-- Cambiar el rol de otro usuario (solo administrador/superadmin, y no el propio).
create function public.admin_set_role(p_user_id uuid, p_role text)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  v_caller_role text;
begin
  select role into v_caller_role from public.profiles where id = auth.uid();
  if v_caller_role not in ('administrador', 'superadmin') then
    raise exception 'No autorizado';
  end if;
  if auth.uid() = p_user_id then
    raise exception 'No podés cambiar tu propio rol';
  end if;
  if p_role not in ('publicador', 'moderador', 'administrador', 'superadmin') then
    raise exception 'Rol inválido';
  end if;
  update public.profiles set role = p_role where id = p_user_id;
end;
$$;

-- Después de correr esto, para tener tu primer superadmin ejecutá (con TU email):
-- update public.profiles set role = 'superadmin'
--   where id = (select id from auth.users where email = 'tu-email@ejemplo.com');
