-- Ejecutar en el SQL Editor de Supabase después de migration_v52_mensaje_solicitante_anuncio.sql.
--
-- Foto de perfil / logo, opcional, por usuario. Se actualiza con un update
-- directo a la fila propia (igual que nombre/whatsapp/instagram/facebook en
-- ProfileModal.tsx) — no hace falta una función nueva, la RLS de profiles
-- ya deja que cada usuario edite su propia fila.

alter table public.profiles add column if not exists avatar_url text;
