-- Ejecutar en el SQL Editor de Supabase después de migration_v36_short_links.sql.
-- Preguntas públicas en la publicación (tipo Mercado Libre): cualquier
-- usuario logueado pregunta, el dueño responde, y queda visible para
-- todos — distinto del contacto privado por WhatsApp. Mismo esquema que
-- listing_reports: insert directo (protegido por policy) para preguntar,
-- RPC solo para responder y para moderación de staff.

alter table public.moderacion_log drop constraint if exists moderacion_log_entity_type_check;
alter table public.moderacion_log add constraint moderacion_log_entity_type_check
  check (entity_type in ('listing', 'anuncio', 'denuncia', 'listing_question'));

create table public.listing_questions (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  asker_id uuid references public.profiles (id) on delete set null,
  pregunta text not null,
  respuesta text,
  estado text not null default 'visible' check (estado in ('visible', 'oculta')),
  created_at timestamptz not null default now(),
  respondida_at timestamptz
);

alter table public.listing_questions enable row level security;

create policy "Ve preguntas visibles, propias, de su publicación, o es staff"
  on public.listing_questions for select
  using (
    estado = 'visible'
    or asker_id = auth.uid()
    or exists (select 1 from public.listings l where l.id = listing_id and l.publisher_id = auth.uid())
    or public.is_staff(auth.uid())
  );

create policy "Usuario logueado pregunta a su nombre"
  on public.listing_questions for insert
  to authenticated
  with check (asker_id = auth.uid());

-- El publicador de la publicación responde (una o más veces — actualiza
-- la misma respuesta si vuelve a escribir).
create function public.responder_pregunta(p_question_id uuid, p_respuesta text)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  v_publisher_id uuid;
begin
  select l.publisher_id into v_publisher_id
  from public.listing_questions q
  join public.listings l on l.id = q.listing_id
  where q.id = p_question_id;

  if v_publisher_id is distinct from auth.uid() then
    raise exception 'No autorizado';
  end if;

  update public.listing_questions set respuesta = p_respuesta, respondida_at = now() where id = p_question_id;
end;
$$;

-- Staff oculta/muestra una pregunta inapropiada (moderación mínima, sin
-- pestaña nueva en el admin — se administra desde la fila de la
-- publicación, igual que fotos/precio/etc.).
create function public.admin_set_question_status(p_question_id uuid, p_estado text)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if not public.is_staff(auth.uid()) then
    raise exception 'No autorizado';
  end if;
  if p_estado not in ('visible', 'oculta') then
    raise exception 'Estado inválido';
  end if;

  update public.listing_questions set estado = p_estado where id = p_question_id;

  insert into public.moderacion_log (entity_type, entity_id, actor_id, accion, detalle)
  values ('listing_question', p_question_id, auth.uid(), 'cambio_estado', p_estado);
end;
$$;

grant execute on function public.responder_pregunta to authenticated;
grant execute on function public.admin_set_question_status to authenticated;
