-- Ejecutar en el SQL Editor de Supabase después de las migraciones anteriores.
-- Arregla un bug real: la migración v15 le agregó el parámetro p_ubicacion a
-- admin_process_anuncio, pero como cambió la firma, Postgres no reemplazó la
-- función vieja de 9 parámetros — quedaron dos versiones superpuestas y
-- PostgREST no podía elegir cuál llamar ("Could not choose the best
-- candidate function..."). Se borra la versión vieja explícitamente.

drop function if exists public.admin_process_anuncio(
  uuid, text, text, text, text, timestamptz, text, int, text
);
