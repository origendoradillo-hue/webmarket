-- Ejecutar en el SQL Editor de Supabase después de las migraciones anteriores.
-- Etapa 9: dónde se muestra cada anuncio — home, páginas de categoría/
-- resultados, o ambas.

alter table public.anuncios add column if not exists ubicacion text not null default 'home'
  check (ubicacion in ('home', 'categoria', 'ambas'));

create or replace function public.admin_process_anuncio(
  p_anuncio_id uuid,
  p_status text default null,
  p_titulo text default null,
  p_descripcion text default null,
  p_imagen_url text default null,
  p_fecha_evento timestamptz default null,
  p_lugar text default null,
  p_orden int default null,
  p_nota text default null,
  p_ubicacion text default null
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

  update public.anuncios set
    status = coalesce(p_status, status),
    titulo = coalesce(p_titulo, titulo),
    descripcion = coalesce(p_descripcion, descripcion),
    imagen_url = coalesce(p_imagen_url, imagen_url),
    fecha_evento = coalesce(p_fecha_evento, fecha_evento),
    lugar = coalesce(p_lugar, lugar),
    orden = coalesce(p_orden, orden),
    ubicacion = coalesce(p_ubicacion, ubicacion),
    updated_at = now()
  where id = p_anuncio_id;

  insert into public.moderacion_log (entity_type, entity_id, actor_id, accion, detalle)
  values ('anuncio', p_anuncio_id, auth.uid(), 'edicion', p_nota);
end;
$$;
