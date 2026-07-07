-- Ejecutar en el SQL Editor de Supabase después de las migraciones anteriores.
-- Etapa 12: contador de vistas por publicación (privado, solo lo ve el
-- publicador) + contador de visitas al sitio + base para el panel de
-- métricas del admin.

-- 1) Vistas por publicación.
alter table public.listings add column if not exists views_count int not null default 0;

-- No cuenta la vista si el que mira es el propio publicador (evita que se
-- infle mirando su propia publicación).
create function public.registrar_vista(p_listing_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  v_publisher_id uuid;
begin
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

-- 2) Visitas al sitio (contador simple, sin datos personales — solo fecha).
create table public.site_visits (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

alter table public.site_visits enable row level security;

create policy "Staff ve las visitas"
  on public.site_visits for select
  to authenticated
  using (public.is_staff(auth.uid()));

create function public.registrar_visita_sitio()
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.site_visits default values;
end;
$$;
