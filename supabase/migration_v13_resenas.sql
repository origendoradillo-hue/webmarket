-- Ejecutar en el SQL Editor de Supabase después de las migraciones anteriores.
-- Etapa 8: reseñas al usuario/publicador (no a la publicación individual).

-- 1) Reseñas. target_user_id se resuelve siempre server-side desde el
--    publisher_id de la publicación (nunca lo manda el cliente), para que
--    no se pueda falsear a quién se reseña. Una reseña por persona por
--    publicación (evita spam del mismo contacto).
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  reviewer_id uuid not null references public.profiles (id) on delete cascade,
  target_user_id uuid not null references public.profiles (id) on delete cascade,
  listing_id uuid references public.listings (id) on delete set null,
  rating smallint not null check (rating between 1 and 5),
  comentario text,
  estado text not null default 'publicada' check (estado in ('publicada', 'oculta')),
  created_at timestamptz not null default now(),
  check (reviewer_id <> target_user_id),
  unique (reviewer_id, listing_id)
);

alter table public.reviews enable row level security;

create policy "Reseñas publicadas son públicas, autor y staff ven todo"
  on public.reviews for select
  to anon, authenticated
  using (estado = 'publicada' or reviewer_id = auth.uid() or public.is_staff(auth.uid()));

-- Toda escritura pasa por submit_review / admin_set_review_report_status
-- (security definer), nunca directo desde el cliente.
revoke insert, update, delete on public.reviews from authenticated, anon;

create function public.submit_review(p_listing_id uuid, p_rating smallint, p_comentario text default null)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  v_target uuid;
begin
  if auth.uid() is null then
    raise exception 'Necesitás iniciar sesión';
  end if;
  if p_rating < 1 or p_rating > 5 then
    raise exception 'La calificación debe ser entre 1 y 5';
  end if;

  select publisher_id into v_target from public.listings where id = p_listing_id;
  if v_target is null then
    raise exception 'Publicación no encontrada';
  end if;
  if v_target = auth.uid() then
    raise exception 'No podés reseñarte a vos mismo';
  end if;

  begin
    insert into public.reviews (reviewer_id, target_user_id, listing_id, rating, comentario)
    values (auth.uid(), v_target, p_listing_id, p_rating, nullif(btrim(p_comentario), ''));
  exception
    when unique_violation then
      raise exception 'Ya dejaste una reseña para esta publicación';
  end;
end;
$$;

-- 2) Denuncias de reseñas (reseñas falsas/abusivas), mismo patrón que
--    listing_reports.
create table public.review_reports (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews (id) on delete cascade,
  reporter_id uuid references public.profiles (id) on delete set null,
  motivo text not null check (motivo in ('informacion_falsa', 'contenido_inapropiado', 'sospecha_falsa', 'otro')),
  justificacion text not null,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'resuelta', 'rechazada')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (review_id, reporter_id)
);

alter table public.review_reports enable row level security;

create policy "Reportante ve sus reportes de reseñas, staff ve todos"
  on public.review_reports for select
  to authenticated
  using (reporter_id = auth.uid() or public.is_staff(auth.uid()));

create policy "Usuario logueado reporta una reseña"
  on public.review_reports for insert
  to authenticated
  with check (reporter_id = auth.uid());

create function public.admin_set_review_report_status(p_report_id uuid, p_estado text)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  v_review_id uuid;
begin
  if not public.is_staff(auth.uid()) then
    raise exception 'No autorizado';
  end if;
  if p_estado not in ('resuelta', 'rechazada') then
    raise exception 'Estado inválido';
  end if;

  select review_id into v_review_id from public.review_reports where id = p_report_id;
  if v_review_id is null then
    raise exception 'Reporte no encontrado';
  end if;

  update public.review_reports set estado = p_estado, updated_at = now() where id = p_report_id;

  if p_estado = 'resuelta' then
    update public.reviews set estado = 'oculta' where id = v_review_id;
  end if;
end;
$$;

-- 3) Rating/cantidad de reseñas cacheados en profiles (evita recalcular en
--    cada card). Ya se mostraba "rating"/"reseñas" en el front con datos de
--    ejemplo; ahora es el promedio real del publicador.
alter table public.profiles add column if not exists rating_promedio numeric;
alter table public.profiles add column if not exists resenas_count int not null default 0;

create function public.refresh_target_rating(p_target_user_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  v_avg numeric;
  v_count int;
begin
  select avg(rating)::numeric(3,2), count(*) into v_avg, v_count
    from public.reviews where target_user_id = p_target_user_id and estado = 'publicada';
  update public.profiles set rating_promedio = v_avg, resenas_count = coalesce(v_count, 0)
    where id = p_target_user_id;
end;
$$;

create function public.trg_reviews_refresh_rating()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    perform public.refresh_target_rating(old.target_user_id);
    return old;
  end if;
  perform public.refresh_target_rating(new.target_user_id);
  if tg_op = 'UPDATE' and new.target_user_id is distinct from old.target_user_id then
    perform public.refresh_target_rating(old.target_user_id);
  end if;
  return new;
end;
$$;

create trigger on_reviews_refresh_rating
  after insert or update or delete on public.reviews
  for each row execute procedure public.trg_reviews_refresh_rating();

-- 4) Hueco de seguridad encontrado de paso: whatsapp_clicks no tenía RLS
--    habilitada, así que cualquier usuario autenticado podía leer TODOS los
--    clics de contacto de TODOS los usuarios por la API directa. Se
--    restringe a: el propio usuario que hizo el clic, el publicador de esa
--    publicación, o staff. También se cierra la escritura directa (solo
--    contactar_publicacion, que corre con permisos elevados, puede insertar).
alter table public.whatsapp_clicks enable row level security;

create policy "Clic propio, publicador de la publicación, o staff"
  on public.whatsapp_clicks for select
  to authenticated
  using (
    clicked_by = auth.uid()
    or exists (select 1 from public.listings l where l.id = listing_id and l.publisher_id = auth.uid())
    or public.is_staff(auth.uid())
  );

revoke insert, update, delete on public.whatsapp_clicks from authenticated, anon;
