-- Ejecutar en el SQL Editor de Supabase después de schema.sql.
-- Guarda si el publicador se identificó como "negocio" o "vecino" en el
-- paso "rol" del wizard (solo aplica a publicaciones de tipo "oferta").
alter table public.listings
  add column rol text check (rol in ('negocio', 'vecino'));
