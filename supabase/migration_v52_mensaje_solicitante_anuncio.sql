-- Ejecutar en el SQL Editor de Supabase después de migration_v51_solicitar_anuncio_completo.sql.
--
-- Quien solicita un anuncio puede dejarle un mensaje al equipo (contexto,
-- pedidos especiales, aclaraciones) — separado de notas_internas, que son
-- las notas que el staff se deja a sí mismo, no lo que carga el solicitante.

alter table public.anuncios add column if not exists mensaje_solicitante text;

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
  p_redes_url text default null,
  p_mensaje_solicitante text default null
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
    mensaje_solicitante, solicitante_id, status
  )
  values (
    p_tipo, p_titulo, p_descripcion, p_imagen_url, p_fecha_evento, p_lugar,
    coalesce(p_layout_type, 'full_banner'), p_background_image_url, p_cta_label, p_cta_url, p_whatsapp_numero, p_redes_url,
    p_mensaje_solicitante, auth.uid(), 'solicitado'
  )
  returning id into v_id;
  return v_id;
end;
$$;

grant execute on function public.solicitar_anuncio(text, text, text, text, timestamptz, text, text, text, text, text, text, text, text) to authenticated;
