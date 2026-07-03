-- Ejecutar en el SQL Editor de Supabase después de las migraciones anteriores.
-- Etapa 7: denuncias de publicaciones.

create table public.listing_reports (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  reporter_id uuid not null references public.profiles (id),
  motivo text not null check (motivo in (
    'informacion_falsa',
    'producto_no_disponible',
    'precio_no_coincide',
    'publicador_no_responde',
    'sospecha_estafa',
    'contenido_inapropiado',
    'categoria_incorrecta',
    'publicacion_duplicada',
    'fotos_falsas',
    'otro'
  )),
  justificacion text not null,
  evidencia_url text,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'en_revision', 'resuelta', 'rechazada')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (listing_id, reporter_id)
);

alter table public.listing_reports enable row level security;

-- Las denuncias no son públicas: el denunciante ve las propias, el staff las ve todas.
create policy "Denunciante ve sus propias denuncias, staff ve todas"
  on public.listing_reports for select
  to authenticated
  using (reporter_id = auth.uid() or public.is_staff(auth.uid()));

create policy "Usuario logueado denuncia a su nombre"
  on public.listing_reports for insert
  to authenticated
  with check (reporter_id = auth.uid());

-- moderacion_log ahora también registra acciones sobre denuncias.
alter table public.moderacion_log drop constraint if exists moderacion_log_entity_type_check;
alter table public.moderacion_log add constraint moderacion_log_entity_type_check
  check (entity_type in ('listing', 'anuncio', 'denuncia'));

create or replace function public.admin_add_nota(p_entity_type text, p_entity_id uuid, p_nota text)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if not public.is_staff(auth.uid()) then
    raise exception 'No autorizado';
  end if;
  if p_entity_type not in ('listing', 'anuncio', 'denuncia') then
    raise exception 'Tipo de entidad inválido';
  end if;
  insert into public.moderacion_log (entity_type, entity_id, actor_id, accion, detalle)
  values (p_entity_type, p_entity_id, auth.uid(), 'nota', p_nota);
end;
$$;

create function public.admin_set_report_status(p_report_id uuid, p_estado text, p_nota text default null)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if not public.is_staff(auth.uid()) then
    raise exception 'No autorizado';
  end if;
  if p_estado not in ('pendiente', 'en_revision', 'resuelta', 'rechazada') then
    raise exception 'Estado inválido';
  end if;
  update public.listing_reports set estado = p_estado, updated_at = now() where id = p_report_id;
  insert into public.moderacion_log (entity_type, entity_id, actor_id, accion, detalle)
  values ('denuncia', p_report_id, auth.uid(), 'cambio_estado', coalesce(p_nota, p_estado));
end;
$$;
