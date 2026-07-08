-- Ejecutar en el SQL Editor de Supabase después de las migraciones anteriores.
-- Redes sociales del publicador (Instagram/Facebook), a nivel perfil — se
-- muestran en todas sus publicaciones. Se edita igual que el resto del
-- perfil (update directo a la fila propia, ya cubierto por la policy de
-- RLS existente de "el usuario edita su propio perfil").
alter table public.profiles add column if not exists instagram_url text;
alter table public.profiles add column if not exists facebook_url text;
