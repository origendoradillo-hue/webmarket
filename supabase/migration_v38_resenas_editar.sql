-- Ejecutar en el SQL Editor de Supabase después de migration_v37_preguntas.sql.
-- Dos cambios a reseñas:
-- 1) El comentario deja de ser opcional — sin texto no se puede dejar
--    calificación (evita estrellas sueltas sin contexto).
-- 2) El autor de una reseña puede editarla o eliminarla (hoy
--    "revoke insert, update, delete" bloqueaba TODO acceso directo,
--    incluso al propio autor — toda escritura pasaba solo por
--    submit_review). Se agregan dos RPCs security definer, mismo
--    patrón que el resto de las escrituras sensibles de este proyecto.

create or replace function public.submit_review(p_listing_id uuid, p_rating smallint, p_comentario text default null)
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
  if btrim(coalesce(p_comentario, '')) = '' then
    raise exception 'Escribí un comentario para dejar tu calificación';
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
    values (auth.uid(), v_target, p_listing_id, p_rating, btrim(p_comentario));
  exception
    when unique_violation then
      raise exception 'Ya dejaste una reseña para esta publicación';
  end;
end;
$$;

create function public.editar_review(p_review_id uuid, p_rating smallint, p_comentario text)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  v_reviewer uuid;
begin
  select reviewer_id into v_reviewer from public.reviews where id = p_review_id;
  if v_reviewer is distinct from auth.uid() then
    raise exception 'No autorizado';
  end if;
  if p_rating < 1 or p_rating > 5 then
    raise exception 'La calificación debe ser entre 1 y 5';
  end if;
  if btrim(coalesce(p_comentario, '')) = '' then
    raise exception 'Escribí un comentario para dejar tu calificación';
  end if;

  update public.reviews set rating = p_rating, comentario = btrim(p_comentario) where id = p_review_id;
end;
$$;

create function public.eliminar_review(p_review_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  v_reviewer uuid;
begin
  select reviewer_id into v_reviewer from public.reviews where id = p_review_id;
  if v_reviewer is distinct from auth.uid() then
    raise exception 'No autorizado';
  end if;

  delete from public.reviews where id = p_review_id;
end;
$$;

grant execute on function public.editar_review to authenticated;
grant execute on function public.eliminar_review to authenticated;
