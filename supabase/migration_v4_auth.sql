-- Ejecutar en el SQL Editor de Supabase después de las migraciones anteriores.
-- Etapa 1: roles consolidados + auth real (email/contraseña verificado + Google).

-- 1) Columnas nuevas de verificación en profiles.
alter table public.profiles add column if not exists email_verified_at timestamptz;
alter table public.profiles add column if not exists whatsapp_verified_at timestamptz;
alter table public.profiles add column if not exists verification_level smallint not null default 1;
alter table public.profiles add column if not exists blocked_at timestamptz;
alter table public.profiles add column if not exists must_change_password boolean not null default false;

alter table public.profiles add constraint profiles_verification_level_check
  check (verification_level in (1, 2, 3));

-- 2) Consolidar moderador + administrador en un único rol "admin".
alter table public.profiles drop constraint if exists profiles_role_check;

update public.profiles set role = 'admin' where role in ('moderador', 'administrador');

alter table public.profiles add constraint profiles_role_check
  check (role in ('publicador', 'admin', 'superadmin'));

-- 3) is_staff() ahora sólo conoce admin/superadmin.
create or replace function public.is_staff(uid uuid)
returns boolean
language sql
security definer set search_path = ''
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = uid and role in ('admin', 'superadmin')
  );
$$;

-- 4) Cambiar roles queda reservado a superadmin (antes también podía
--    administrador). Gestión de usuarios es tarea exclusiva de superadmin.
create or replace function public.admin_set_role(p_user_id uuid, p_role text)
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
  if auth.uid() = p_user_id then
    raise exception 'No podés cambiar tu propio rol';
  end if;
  if p_role not in ('publicador', 'admin', 'superadmin') then
    raise exception 'Rol inválido';
  end if;
  update public.profiles set role = p_role where id = p_user_id;
end;
$$;

-- 5) Bloquear/desbloquear usuario (solo superadmin) — soporte de base para
--    la Etapa 5; sin UI todavía.
create or replace function public.admin_set_blocked(p_user_id uuid, p_blocked boolean)
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
  if auth.uid() = p_user_id then
    raise exception 'No podés bloquearte a vos mismo';
  end if;
  update public.profiles
    set blocked_at = case when p_blocked then now() else null end
    where id = p_user_id;
end;
$$;

-- 6) Solicitudes de verificación reforzada (Nivel 3). Sin UI todavía
--    (Etapas 2 y 5 la usan); se crea ahora junto con el resto de auth.
create table public.user_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  nivel_solicitado smallint not null check (nivel_solicitado in (2, 3)),
  motivo text not null,
  evidencia_url text,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'aprobada', 'rechazada')),
  revisado_por uuid references public.profiles (id),
  revisado_en timestamptz,
  created_at timestamptz not null default now()
);

alter table public.user_verifications enable row level security;

create policy "Usuario ve sus propias solicitudes de verificación"
  on public.user_verifications for select
  to authenticated
  using (user_id = auth.uid() or public.is_staff(auth.uid()));

create policy "Usuario crea su propia solicitud de verificación"
  on public.user_verifications for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Staff revisa solicitudes de verificación"
  on public.user_verifications for update
  to authenticated
  using (public.is_staff(auth.uid()));

-- 7) handle_new_user() ahora lee full_name/whatsapp_number de los metadatos
--    del signup en vez de solo new.phone: el signup con email+contraseña
--    manda whatsapp_number/full_name en options.data, y el login con Google
--    manda full_name/name automáticamente en raw_user_meta_data.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, whatsapp_number, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'whatsapp_number', new.phone),
    new.email
  );
  return new;
end;
$$;

-- 8) Reflejar auth.users.email_confirmed_at en profiles.email_verified_at,
--    para que el panel admin pueda leer el estado de verificación con un
--    select normal a profiles (sin necesitar acceso a auth.users).
create or replace function public.sync_email_verified()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if new.email_confirmed_at is distinct from old.email_confirmed_at then
    update public.profiles set email_verified_at = new.email_confirmed_at where id = new.id;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_email_confirmed
  after update on auth.users
  for each row execute procedure public.sync_email_verified();

-- Después de correr esto:
-- 1. Activar "Confirm email" en Authentication → Providers → Email.
-- 2. Configurar el provider de Google en Authentication → Providers → Google
--    (Client ID/Secret de Google Cloud Console).
-- 3. Verificar que no queden roles viejos: select distinct role from public.profiles;
