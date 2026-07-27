-- Ejecutar en el SQL Editor de Supabase después de migration_v50_emprendimiento_descuento.sql.
--
-- La solicitud pública de anuncio solo pedía tipo/título/descripción/fecha/
-- lugar — todo lo visual (layout, imagen, fondo, CTA, WhatsApp, redes)
-- quedaba en blanco y el staff tenía que completarlo a mano yendo y viniendo
-- con quien lo pidió. Ahora quien solicita puede cargar todo eso también;
-- sigue quedando en status 'solicitado' hasta que el staff lo revise,
-- apruebe y publique — esto no cambia el circuito de aprobación, solo
-- reduce cuánto hay que completar después.

-- Mismo patrón que migraciones anteriores: "create or replace function" con
-- una lista de parámetros distinta no reemplaza la función existente en
-- Postgres — hay que borrar todas las versiones acumuladas antes de
-- recrearla.
do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'solicitar_anuncio'
  loop
    execute format('drop function %s', r.sig);
  end loop;
end $$;

create function public.solicitar_anuncio(
  p_tipo text,
  p_titulo text,
  p_descripcion text,
  p_imagen_url text default null,
  p_fecha_evento timestamptz default null,
  p_lugar text default null,
  p_layout_type text default null,
  p_background_image_url text default null,
  p_cta_label text default null,
  p_cta_url text default null,
  p_whatsapp_numero text default null,
  p_redes_url text default null
)
returns uuid
language plpgsql
security definer set search_path = ''
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Debés iniciar sesión';
  end if;
  if p_layout_type is not null and p_layout_type not in
    ('flyer_on_sign', 'full_banner', 'text_only', 'background_image') then
    raise exception 'Layout inválido';
  end if;

  insert into public.anuncios (
    tipo, titulo, descripcion, imagen_url, fecha_evento, lugar,
    layout_type, background_image_url, cta_label, cta_url, whatsapp_numero, redes_url,
    solicitante_id, status
  )
  values (
    p_tipo, p_titulo, p_descripcion, p_imagen_url, p_fecha_evento, p_lugar,
    coalesce(p_layout_type, 'full_banner'), p_background_image_url, p_cta_label, p_cta_url, p_whatsapp_numero, p_redes_url,
    auth.uid(), 'solicitado'
  )
  returning id into v_id;
  return v_id;
end;
$$;

grant execute on function public.solicitar_anuncio(text, text, text, text, timestamptz, text, text, text, text, text, text, text) to authenticated;
