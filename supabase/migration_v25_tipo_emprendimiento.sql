-- Ejecutar en el SQL Editor de Supabase después de las migraciones anteriores.
-- Se saca el tipo "herramienta" (no tenía publicaciones propias, se
-- superponía con "usado") y se suma "emprendimiento" para darle más lugar a
-- los negocios/locales del barrio (ej: un local que vende frutos secos).

-- Por las dudas, reclasifica cualquier publicación "herramienta" que exista
-- como "producto" antes de sacar el valor del check constraint.
update public.listings set tipo = 'producto' where tipo = 'herramienta';

alter table public.listings drop constraint if exists listings_tipo_check;
alter table public.listings add constraint listings_tipo_check
  check (tipo in ('producto', 'servicio', 'experiencia', 'inmueble', 'usado', 'emprendimiento', 'otro'));
