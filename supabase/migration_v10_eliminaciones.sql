-- Ejecutar en el SQL Editor de Supabase después de las migraciones anteriores.
-- Etapa: superadmin puede eliminar publicaciones definitivamente y eliminar
-- usuarios. Para que borrar un usuario no falle por referencias, las tablas
-- que apuntan a profiles sin "on delete cascade" pasan a "on delete set null"
-- (o cascade cuando no puede quedar null).

alter table public.moderacion_log drop constraint if exists moderacion_log_actor_id_fkey;
alter table public.moderacion_log add constraint moderacion_log_actor_id_fkey
  foreign key (actor_id) references public.profiles (id) on delete set null;

alter table public.anuncios drop constraint if exists anuncios_solicitante_id_fkey;
alter table public.anuncios add constraint anuncios_solicitante_id_fkey
  foreign key (solicitante_id) references public.profiles (id) on delete set null;

alter table public.whatsapp_clicks drop constraint if exists whatsapp_clicks_clicked_by_fkey;
alter table public.whatsapp_clicks add constraint whatsapp_clicks_clicked_by_fkey
  foreign key (clicked_by) references public.profiles (id) on delete set null;

alter table public.listing_reports alter column reporter_id drop not null;
alter table public.listing_reports drop constraint if exists listing_reports_reporter_id_fkey;
alter table public.listing_reports add constraint listing_reports_reporter_id_fkey
  foreign key (reporter_id) references public.profiles (id) on delete set null;

-- Eliminar una publicación de verdad (no solo cambiar su estado a "eliminada").
-- Solo superadmin. Deja constancia en moderacion_log antes de borrar.
create function public.admin_delete_listing(p_listing_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if not public.is_superadmin(auth.uid()) then
    raise exception 'No autorizado';
  end if;
  insert into public.moderacion_log (entity_type, entity_id, actor_id, accion, detalle)
  values ('listing', p_listing_id, auth.uid(), 'eliminada_permanente', null);
  delete from public.listings where id = p_listing_id;
end;
$$;
