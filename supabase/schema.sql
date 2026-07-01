-- Esquema mínimo funcional para Origen El Doradillo (MVP con Supabase).
-- Pegar completo en Supabase → SQL Editor → New query → Run.

-- 1) Perfiles: se crea automáticamente un perfil cuando alguien se registra.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  whatsapp_number text,
  role text not null default 'publicador' check (role in ('publicador', 'moderador', 'administrador', 'superadmin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Cualquier autenticado puede ver nombres de perfiles"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Cada usuario edita solo su propio perfil"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- Crea el perfil automáticamente al registrarse, copiando el teléfono verificado.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, whatsapp_number)
  values (new.id, new.phone);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2) Publicaciones.
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  publisher_id uuid not null references public.profiles (id) on delete cascade,
  tipo_aviso text not null check (tipo_aviso in ('oferta', 'demanda', 'evento')),
  categoria text not null,
  subcategoria text not null,
  zona text not null,
  cuadrante text,
  direccion text,
  nombre text not null,
  descripcion text not null,
  foto_url text,
  modalidad text[] not null default '{}',
  tags text[] not null default '{}',
  cantidad int,
  status text not null default 'en_revision'
    check (status in ('borrador', 'en_revision', 'publicada', 'observada', 'rechazada', 'pausada', 'vencida', 'eliminada')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.listings enable row level security;

create policy "Cualquiera puede ver publicaciones publicadas"
  on public.listings for select
  to anon, authenticated
  using (status = 'publicada');

create policy "El publicador ve sus propias publicaciones en cualquier estado"
  on public.listings for select
  to authenticated
  using (auth.uid() = publisher_id);

create policy "Usuarios autenticados crean publicaciones a su nombre"
  on public.listings for insert
  to authenticated
  with check (auth.uid() = publisher_id and status = 'en_revision');

create policy "El publicador edita sus propias publicaciones"
  on public.listings for update
  to authenticated
  using (auth.uid() = publisher_id);

create policy "El publicador borra sus propias publicaciones"
  on public.listings for delete
  to authenticated
  using (auth.uid() = publisher_id);

-- 3) Clics a WhatsApp (métrica simple).
create table public.whatsapp_clicks (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  clicked_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

alter table public.whatsapp_clicks enable row level security;

create policy "Usuarios autenticados registran sus propios clics"
  on public.whatsapp_clicks for insert
  to authenticated
  with check (auth.uid() = clicked_by);

-- 4) Función para obtener el WhatsApp de un publicador SOLO si estás logueado.
-- El número nunca viaja en el listado público — se resuelve acá, y de paso
-- registra el clic para métricas.
create function public.contactar_publicacion(p_listing_id uuid)
returns text
language plpgsql
security definer set search_path = ''
as $$
declare
  v_whatsapp text;
begin
  if auth.uid() is null then
    raise exception 'Debés iniciar sesión para contactar por WhatsApp';
  end if;

  select pr.whatsapp_number into v_whatsapp
  from public.listings l
  join public.profiles pr on pr.id = l.publisher_id
  where l.id = p_listing_id and l.status = 'publicada';

  if v_whatsapp is null then
    raise exception 'Publicación no encontrada';
  end if;

  insert into public.whatsapp_clicks (listing_id, clicked_by) values (p_listing_id, auth.uid());

  return v_whatsapp;
end;
$$;

-- 5) Storage para las fotos de publicaciones.
insert into storage.buckets (id, name, public)
values ('listing-photos', 'listing-photos', true)
on conflict (id) do nothing;

create policy "Cualquiera puede ver las fotos de publicaciones"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'listing-photos');

create policy "Usuarios autenticados suben sus propias fotos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'listing-photos');
