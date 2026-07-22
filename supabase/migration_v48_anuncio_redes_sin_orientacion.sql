-- Ejecutar en el SQL Editor de Supabase después de migration_v47_foto_portada.sql.
--
-- "Orientación de la imagen" (image_orientation) nunca controlaba nada:
-- ni el recorte ni el render de ningún layout — el aspecto de la imagen
-- lo define layout_type (fijo para flyer_on_sign, libre para el resto).
-- Se saca del todo para no confundir en el panel. De paso se agrega un
-- link de redes sociales, para un botón más en el detalle del anuncio
-- además del CTA genérico y WhatsApp.

alter table public.anuncios drop column if exists image_orientation;
alter table public.anuncios add column if not exists redes_url text;

-- Mismo patrón que v46/v47: "create or replace function" con una lista
-- de parámetros distinta no reemplaza la función existente en Postgres,
-- crea un overload nuevo y deja la vieja viva — hay que borrar todas las
-- versiones acumuladas antes de recrearla.
do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'admin_process_anuncio'
  loop
    execute format('drop function %s', r.sig);
  end loop;
end $$;

create function public.admin_process_anuncio(
  p_anuncio_id uuid,
  p_status text default null,
  p_titulo text default null,
  p_descripcion text default null,
  p_imagen_url text default null,
  p_fecha_evento timestamptz default null,
  p_lugar text default null,
  p_orden int default null,
  p_nota text default null,
  p_ubicacion text default null,
  p_layout_type text default null,
  p_background_image_url text default null,
  p_cta_label text default null,
  p_cta_url text default null,
  p_whatsapp_numero text default null,
  p_tipo text default null,
  p_redes_url text default null
)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if not public.is_staff(auth.uid()) then
    raise exception 'No autorizado';
  end if;
  if p_status is not null and p_status not in
    ('solicitado', 'en_conversacion', 'aprobado', 'programado', 'publicado', 'pausado', 'vencido', 'rechazado') then
    raise exception 'Estado inválido';
  end if;
  if p_ubicacion is not null and p_ubicacion not in ('home', 'categoria', 'ambas') then
    raise exception 'Ubicación inválida';
  end if;
  if p_layout_type is not null and p_layout_type not in
    ('flyer_on_sign', 'full_banner', 'text_only', 'background_image') then
    raise exception 'Layout inválido';
  end if;
  if p_tipo is not null and p_tipo not in
    ('evento', 'aviso_barrial', 'sponsor', 'promocion', 'comunicado', 'feria', 'novedad') then
    raise exception 'Tipo inválido';
  end if;

  update public.anuncios set
    status = coalesce(p_status, status),
    titulo = coalesce(p_titulo, titulo),
    descripcion = coalesce(p_descripcion, descripcion),
    imagen_url = coalesce(p_imagen_url, imagen_url),
    fecha_evento = coalesce(p_fecha_evento, fecha_evento),
    lugar = coalesce(p_lugar, lugar),
    orden = coalesce(p_orden, orden),
    ubicacion = coalesce(p_ubicacion, ubicacion),
    layout_type = coalesce(p_layout_type, layout_type),
    background_image_url = coalesce(p_background_image_url, background_image_url),
    cta_label = coalesce(p_cta_label, cta_label),
    cta_url = coalesce(p_cta_url, cta_url),
    whatsapp_numero = coalesce(p_whatsapp_numero, whatsapp_numero),
    tipo = coalesce(p_tipo, tipo),
    redes_url = coalesce(p_redes_url, redes_url),
    updated_at = now()
  where id = p_anuncio_id;

  insert into public.moderacion_log (entity_type, entity_id, actor_id, accion, detalle)
  values ('anuncio', p_anuncio_id, auth.uid(), 'edicion', p_nota);
end;
$$;

grant execute on function public.admin_process_anuncio(uuid, text, text, text, text, timestamptz, text, int, text, text, text, text, text, text, text, text, text) to authenticated;
