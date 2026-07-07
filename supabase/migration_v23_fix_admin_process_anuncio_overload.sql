-- Ejecutar en el SQL Editor de Supabase después de migration_v22.
-- Mismo problema que migration_v16: agregar parámetros nuevos con
-- "create or replace function" no reemplaza la versión anterior si Postgres
-- considera que la lista de tipos de argumentos cambió — crea una versión
-- más en vez de reemplazar, y quedan varias compitiendo ("Could not choose
-- the best candidate function"). Se borran explícitamente las firmas viejas
-- (la anterior a migration_v15, y la de migration_v15/v16) para que solo
-- quede la versión de 15 parámetros de migration_v22.

drop function if exists public.admin_process_anuncio(
  uuid, text, text, text, text, timestamptz, text, int, text
);

drop function if exists public.admin_process_anuncio(
  uuid, text, text, text, text, timestamptz, text, int, text, text
);
