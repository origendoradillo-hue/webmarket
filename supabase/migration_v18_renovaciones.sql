-- Ejecutar en el SQL Editor de Supabase después de las migraciones anteriores.
-- Etapa 11: vencimiento real por tipo, renovación de autoservicio, y paso
-- automático a "vencida".

-- 1) Al crear una publicación, si no viene con expires_at, se calcula según
--    el tipo (30 días producto/usado/herramienta/otro, 60 servicio/
--    experiencia, 90 inmueble).
create or replace function public.set_listing_expiry()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  v_days int;
begin
  if new.expires_at is not null then
    return new;
  end if;
  v_days := case new.tipo
    when 'servicio' then 60
    when 'experiencia' then 60
    when 'inmueble' then 90
    else 30
  end;
  new.expires_at := now() + (v_days || ' days')::interval;
  return new;
end;
$$;

drop trigger if exists on_listing_insert_set_expiry on public.listings;
create trigger on_listing_insert_set_expiry
  before insert on public.listings
  for each row execute procedure public.set_listing_expiry();

-- 2) Historial de renovaciones (auditoría, no requiere aprobación).
create table public.renewal_requests (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  renewed_by uuid references public.profiles (id) on delete set null,
  previous_expires_at timestamptz,
  new_expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.renewal_requests enable row level security;

create policy "El dueño ve sus renovaciones, staff ve todas"
  on public.renewal_requests for select
  to authenticated
  using (
    exists (select 1 from public.listings l where l.id = listing_id and l.publisher_id = auth.uid())
    or public.is_staff(auth.uid())
  );

-- 3) Renovar: de autoservicio, el dueño la hace solo. Reactiva la
--    publicación si estaba pausada o vencida (no si está en un estado de
--    moderación como observada/rechazada/eliminada).
create function public.renovar_publicacion(p_listing_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  v_owner uuid;
  v_tipo text;
  v_status text;
  v_prev_expires timestamptz;
  v_days int;
  v_new_expires timestamptz;
begin
  select publisher_id, tipo, status, expires_at into v_owner, v_tipo, v_status, v_prev_expires
    from public.listings where id = p_listing_id;

  if v_owner is distinct from auth.uid() then
    raise exception 'No autorizado';
  end if;
  if v_status not in ('activa', 'pausada', 'vencida') then
    raise exception 'Esta publicación no se puede renovar en su estado actual';
  end if;

  v_days := case v_tipo
    when 'servicio' then 60
    when 'experiencia' then 60
    when 'inmueble' then 90
    else 30
  end;
  v_new_expires := now() + (v_days || ' days')::interval;

  update public.listings set status = 'activa', expires_at = v_new_expires, updated_at = now()
    where id = p_listing_id;

  insert into public.renewal_requests (listing_id, renewed_by, previous_expires_at, new_expires_at)
    values (p_listing_id, auth.uid(), v_prev_expires, v_new_expires);
end;
$$;

-- 4) Pasar a "vencida" las publicaciones activas cuyo plazo ya pasó. Sin
--    cron disponible, se llama desde el front en cada carga del home/panel
--    (barato e idempotente).
create function public.expire_old_listings()
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  update public.listings set status = 'vencida', updated_at = now()
  where status = 'activa' and expires_at is not null and expires_at < now();
end;
$$;
