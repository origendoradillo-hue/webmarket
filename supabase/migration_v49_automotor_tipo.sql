-- Ejecutar en el SQL Editor de Supabase después de migration_v48_anuncio_redes_sin_orientacion.sql.
--
-- "Automotor" estaba escondido como una subcategoría más ("Vehículos")
-- adentro del tipo "usado" — pasa a ser un tipo de publicación de primer
-- nivel, al mismo nivel que "Inmuebles", con sus propias categorías.

alter table public.listings drop constraint if exists listings_tipo_check;
alter table public.listings add constraint listings_tipo_check
  check (tipo in ('producto', 'servicio', 'experiencia', 'inmueble', 'automotor', 'usado', 'emprendimiento', 'otro'));

-- La categoría "Vehículos" ya existente se reutiliza (mismo id, así las
-- publicaciones que ya la tenían cargada no quedan huérfanas) pero pasa
-- de tipo_scope=usado a tipo_scope=automotor, con un label más específico
-- ahora que "Motos" es una categoría aparte.
update public.categories
  set tipo_scope = array['automotor'], label = 'Autos y camionetas', orden = 1
  where id = 'usado_vehiculos';

insert into public.categories (id, label, icon, orden, tipo_scope) values
  ('automotor_motos', 'Motos y cuatriciclos', 'ti-motorbike', 2, array['automotor']),
  ('automotor_otros', 'Otros vehículos', 'ti-dots', 3, array['automotor'])
on conflict (id) do nothing;

-- Las publicaciones que ya estaban en tipo=usado/categoria=usado_vehiculos
-- pasan a tipo=automotor (la categoría en sí no cambia de id).
update public.listings
  set tipo = 'automotor'
  where tipo = 'usado' and categoria = 'usado_vehiculos';
