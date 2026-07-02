-- Ejecutar en el SQL Editor de Supabase después de las migraciones anteriores.

-- Separar "usado_herramienta" en dos tipos: usado / herramienta.
alter table public.listings drop constraint if exists listings_tipo_check;

update public.listings set tipo = case
  when tipo = 'usado_herramienta' and subcategoria = 'Herramientas' then 'herramienta'
  when tipo = 'usado_herramienta' then 'usado'
  else tipo
end;

alter table public.listings add constraint listings_tipo_check
  check (tipo in ('producto', 'servicio', 'experiencia', 'inmueble', 'usado', 'herramienta', 'otro'));

-- Ahora "tipo" es obligatorio siempre (antes solo para "ofrezco") — "busco"
-- también necesita tipo para poder navegarse por categoría desde la home.
alter table public.listings drop constraint if exists listings_tipo_requerido_check;
update public.listings set tipo = 'otro' where tipo is null;
alter table public.listings alter column tipo set not null;

-- Etiquetas transversales combinables (turismo, alquileres_temporarios).
alter table public.listings add column etiquetas text[] not null default '{}';
