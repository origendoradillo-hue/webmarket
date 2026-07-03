-- Ejecutar en el SQL Editor de Supabase después de las migraciones anteriores.
-- Etapa 4: categorías, subcategorías y zonas pasan a ser tablas editables
-- desde el panel admin (antes vivían hardcodeadas en lib/data.ts).

create table public.categories (
  id text primary key,
  label text not null,
  icon text not null,
  orden int not null default 0,
  created_at timestamptz not null default now()
);

create table public.subcategories (
  id uuid primary key default gen_random_uuid(),
  category_id text not null references public.categories (id) on delete cascade,
  label text not null,
  orden int not null default 0
);

create table public.zones (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  orden int not null default 0
);

alter table public.categories enable row level security;
alter table public.subcategories enable row level security;
alter table public.zones enable row level security;

create policy "Cualquiera lee categorías" on public.categories for select using (true);
create policy "Cualquiera lee subcategorías" on public.subcategories for select using (true);
create policy "Cualquiera lee zonas" on public.zones for select using (true);

-- Administrar categorías/zonas es tarea exclusiva de superadmin (mismo
-- criterio que gestión de usuarios), no de todo el staff.
create function public.is_superadmin(uid uuid)
returns boolean
language sql
security definer set search_path = ''
stable
as $$
  select exists (select 1 from public.profiles where id = uid and role = 'superadmin');
$$;

create policy "Superadmin administra categorías" on public.categories for all to authenticated using (public.is_superadmin(auth.uid()));
create policy "Superadmin administra subcategorías" on public.subcategories for all to authenticated using (public.is_superadmin(auth.uid()));
create policy "Superadmin administra zonas" on public.zones for all to authenticated using (public.is_superadmin(auth.uid()));

-- Semilla: mismos datos que hoy viven hardcodeados en lib/data.ts, para que
-- no cambie nada visible al activar esta migración.
insert into public.categories (id, label, icon, orden) values
  ('productores', 'Productores y chacras', 'ti-leaf', 1),
  ('gastronomia', 'Gastronomía', 'ti-bread', 2),
  ('oficios', 'Oficios y servicios', 'ti-tools', 3),
  ('construccion', 'Construcción y ramos generales', 'ti-building-warehouse', 4),
  ('turismo', 'Turismo y experiencias', 'ti-compass', 5),
  ('hospedaje', 'Hotelería y hospedaje', 'ti-bed', 6),
  ('inmuebles', 'Inmuebles', 'ti-home', 7),
  ('usados', 'Usados y herramientas', 'ti-recycle', 8);

insert into public.subcategories (category_id, label, orden) values
  ('productores', 'Aceite y frutos secos', 1),
  ('productores', 'Huevos y aviar', 2),
  ('productores', 'Miel y dulces caseros', 3),
  ('productores', 'Verduras y quintas', 4),
  ('productores', 'Forrajería', 5),
  ('productores', 'Viveros y plantines', 6),
  ('gastronomia', 'Panadería y pastelería', 1),
  ('gastronomia', 'Comidas preparadas', 2),
  ('gastronomia', 'Dulces y conservas', 3),
  ('gastronomia', 'Foodtrucks y eventos', 4),
  ('oficios', 'Herrería y forja', 1),
  ('oficios', 'Electricidad', 2),
  ('oficios', 'Plomería', 3),
  ('oficios', 'Jardinería y poda', 4),
  ('oficios', 'Cuidado de animales', 5),
  ('oficios', 'Transporte y flete', 6),
  ('oficios', 'Limpieza', 7),
  ('construccion', 'Albañilería', 1),
  ('construccion', 'Bioconstrucción', 2),
  ('construccion', 'Ferretería y ramos generales', 3),
  ('construccion', 'Corralón e insumos', 4),
  ('construccion', 'Herramientas', 5),
  ('turismo', 'Cabalgatas', 1),
  ('turismo', 'Avistaje y trekking', 2),
  ('turismo', 'Excursiones 4x4', 3),
  ('turismo', 'Eventos y celebraciones', 4),
  ('hospedaje', 'Cabañas', 1),
  ('hospedaje', 'Hostería', 2),
  ('hospedaje', 'Camping', 3),
  ('hospedaje', 'Alquiler temporario', 4),
  ('inmuebles', 'Venta de lotes y chacras', 1),
  ('inmuebles', 'Alquiler', 2),
  ('inmuebles', 'Terrenos con mejoras', 3),
  ('usados', 'Herramientas', 1),
  ('usados', 'Electrodomésticos', 2),
  ('usados', 'Materiales de construcción', 3),
  ('usados', 'Muebles', 4),
  ('usados', 'Otros usados', 5);

insert into public.zones (label, orden) values
  ('Zona 1', 1),
  ('Zona 2', 2),
  ('Zona 3', 3);
