-- Ejecutar en el SQL Editor de Supabase después de las migraciones anteriores.
-- Denuncias, versión simple: el denunciado puede responder, y se suma un
-- motivo específico de insultos/agravios que habilita suspender a ambas
-- partes (reutiliza el bloqueo ya existente, admin_set_blocked — no hay
-- suspensión por tiempo todavía, es indefinida hasta que un superadmin
-- desbloquee manualmente).

alter table public.listing_reports add column if not exists respuesta_denunciado text;

alter table public.listing_reports drop constraint if exists listing_reports_motivo_check;
alter table public.listing_reports add constraint listing_reports_motivo_check
  check (motivo in (
    'informacion_falsa',
    'producto_no_disponible',
    'precio_no_coincide',
    'publicador_no_responde',
    'sospecha_estafa',
    'contenido_inapropiado',
    'categoria_incorrecta',
    'publicacion_duplicada',
    'fotos_falsas',
    'insultos_agravios',
    'otro'
  ));

-- El publicador de la publicación denunciada responde (una vez).
create function public.responder_denuncia(p_report_id uuid, p_respuesta text)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  v_publisher_id uuid;
begin
  select l.publisher_id into v_publisher_id
  from public.listing_reports r
  join public.listings l on l.id = r.listing_id
  where r.id = p_report_id;

  if v_publisher_id is distinct from auth.uid() then
    raise exception 'No autorizado';
  end if;

  update public.listing_reports set respuesta_denunciado = p_respuesta where id = p_report_id;
end;
$$;
