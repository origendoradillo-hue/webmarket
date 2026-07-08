-- Ejecutar en el SQL Editor de Supabase después de las migraciones anteriores.
-- Favoritos: el usuario guarda publicaciones y las administra. Tabla simple,
-- sin RPC — el usuario opera directo sobre sus propias filas (mismo patrón
-- de "todo o nada sobre la fila propia" que profiles/reviews de lectura).
create table public.favoritos (
  user_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

alter table public.favoritos enable row level security;

create policy "El usuario administra sus propios favoritos"
  on public.favoritos for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
