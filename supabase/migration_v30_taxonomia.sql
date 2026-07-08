-- Ejecutar en el SQL Editor de Supabase después de migration_v29_borradores.sql.
-- Reestructura la taxonomía: Categoría deja de ser una lista global plana y
-- pasa a pertenecer a uno o más Tipos de publicación (tipo_scope), en vez de
-- convivir como tres sistemas de filtro paralelos (Rubro / Tipo / Etiquetas).
-- Ver plan completo en la conversación: "Reestructuración de taxonomía".

alter table public.categories add column if not exists tipo_scope text[] not null default '{}';

-- ============================================================
-- 1) Categorías existentes que se reutilizan: se les asigna tipo_scope.
-- ============================================================

update public.categories set tipo_scope = array['producto', 'emprendimiento'] where id = 'productores';
update public.categories set tipo_scope = array['producto', 'emprendimiento'] where id = 'gastronomia';
update public.categories set tipo_scope = array['servicio', 'emprendimiento'] where id = 'oficios';
update public.categories set tipo_scope = array['servicio', 'emprendimiento'] where id = 'construccion';
update public.categories set tipo_scope = array['experiencia'] where id = 'turismo';
update public.categories set tipo_scope = array['inmueble'] where id = 'hospedaje';

-- ============================================================
-- 2) Subcategorías de las categorías reutilizadas: se actualizan a la
--    lista nueva (se borran las viejas y se insertan las nuevas, por
--    categoría, para no dejar mezcla de subs viejas y nuevas).
-- ============================================================

delete from public.subcategories where category_id in ('productores', 'oficios', 'turismo', 'hospedaje');

insert into public.subcategories (category_id, label, orden) values
  ('productores', 'Verduras y frutas', 1),
  ('productores', 'Huevos y lácteos', 2),
  ('productores', 'Miel y dulces', 3),
  ('productores', 'Plantas y vivero', 4),
  ('productores', 'Forrajería', 5),
  ('productores', 'Otros de chacra', 6),
  ('oficios', 'Plomería', 1),
  ('oficios', 'Electricidad', 2),
  ('oficios', 'Gasista', 3),
  ('oficios', 'Jardinería', 4),
  ('oficios', 'Limpieza', 5),
  ('oficios', 'Cuidado de mascotas', 6),
  ('oficios', 'Otros oficios', 7),
  ('turismo', 'Cabalgatas', 1),
  ('turismo', 'Avistaje de fauna', 2),
  ('turismo', 'Paseos guiados', 3),
  ('turismo', 'Degustaciones', 4),
  ('turismo', 'Talleres', 5),
  ('turismo', 'Otras experiencias', 6),
  ('hospedaje', 'Cabañas', 1),
  ('hospedaje', 'Habitaciones', 2),
  ('hospedaje', 'Casas completas', 3);

-- Gastronomía y Construcción también renuevan subs (su tipo_scope ya
-- quedó asignado en la sección 1).
delete from public.subcategories where category_id in ('gastronomia', 'construccion');

insert into public.subcategories (category_id, label, orden) values
  ('gastronomia', 'Panificados', 1),
  ('gastronomia', 'Conservas y ahumados', 2),
  ('gastronomia', 'Bebidas', 3),
  ('gastronomia', 'Otros alimentos', 4),
  ('construccion', 'Albañilería', 1),
  ('construccion', 'Herrería', 2),
  ('construccion', 'Pintura', 3),
  ('construccion', 'Provisión de materiales', 4);

-- ============================================================
-- 3) Categorías nuevas (sin subcategorías, salvo Instrumentos).
-- ============================================================

insert into public.categories (id, label, icon, orden, tipo_scope) values
  ('producto_instrumentos', 'Instrumentos', 'ti-guitar-pick', 3, array['producto', 'emprendimiento']),
  ('producto_otros', 'Otros productos', 'ti-dots', 4, array['producto', 'emprendimiento']),
  ('servicio_otros', 'Otros servicios', 'ti-dots', 3, array['servicio', 'emprendimiento']),
  ('inmueble_alquiler', 'Alquiler permanente', 'ti-key', 2, array['inmueble']),
  ('inmueble_venta', 'Venta', 'ti-home-dollar', 3, array['inmueble']),
  ('inmueble_terrenos', 'Terrenos y chacras', 'ti-map-2', 4, array['inmueble']),
  ('usado_herramientas', 'Herramientas', 'ti-hammer', 1, array['usado']),
  ('usado_instrumentos', 'Instrumentos', 'ti-guitar-pick', 2, array['usado']),
  ('usado_muebles', 'Muebles y hogar', 'ti-armchair', 3, array['usado']),
  ('usado_vehiculos', 'Vehículos', 'ti-car', 4, array['usado']),
  ('usado_otros', 'Otros usados', 'ti-dots', 5, array['usado']),
  ('otro_varios', 'Varios', 'ti-dots', 1, array['otro']);

insert into public.subcategories (category_id, label, orden) values
  ('producto_instrumentos', 'Percusión', 1),
  ('producto_instrumentos', 'Cuerdas', 2),
  ('producto_instrumentos', 'Vientos', 3),
  ('producto_instrumentos', 'Accesorios', 4);

-- ============================================================
-- 4) Remapeo de las publicaciones reales existentes, antes de borrar
--    'inmuebles'/'usados' (ver sección 5) para no dejar categorías
--    huérfanas apuntando a ids que están por desaparecer.
-- ============================================================

-- 3 publicaciones de instrumentos usados: 'usados' está por dejar de
-- existir como categoría, pasan a 'usado_instrumentos' (que ahora es la
-- categoría en sí, sin subcategoría debajo).
update public.listings
  set categoria = 'usado_instrumentos', subcategoria = null
  where tipo = 'usado' and categoria = 'usados' and subcategoria = 'Instrumentos';

-- Cualquier otra publicación que haya quedado con categoria='usados' (no
-- vista en los datos reales al momento de escribir esta migración, pero
-- por las dudas) pierde la categoría en vez de quedar huérfana.
update public.listings set categoria = null, subcategoria = null where categoria = 'usados';

-- 'inmuebles' también deja de existir como categoría (sus 3 subs viejas
-- pasan a ser categorías propias: hospedaje/inmueble_alquiler/
-- inmueble_venta/inmueble_terrenos). Incluye la publicación de prueba
-- con combinación inválida (tipo=experiencia + categoria=inmuebles, que
-- nunca debió ser posible) — se sugiere borrarla directamente desde
-- Admin en vez de reasignarle algo.
update public.listings set categoria = null, subcategoria = null where categoria = 'inmuebles';

-- 'Plomero' (servicio/oficios/Plomería) no necesita cambios: la label de
-- la subcategoría se mantuvo igual en el update de la sección 2.

-- ============================================================
-- 5) Se retiran 'inmuebles' y 'usados'. El on delete cascade de
--    subcategories.category_id se encarga de sus subs viejas.
-- ============================================================

delete from public.categories where id in ('inmuebles', 'usados');
