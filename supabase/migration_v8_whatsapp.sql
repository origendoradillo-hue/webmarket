-- Ejecutar en el SQL Editor de Supabase después de las migraciones anteriores.
-- Etapa 6: WhatsApp con reglas de visibilidad (público vs requiere login).

alter table public.listings add column whatsapp_publico boolean not null default false;

-- Los clics anónimos (contacto público) no tienen usuario asociado.
alter table public.whatsapp_clicks alter column clicked_by drop not null;

alter table public.whatsapp_clicks add column tipo_contacto text not null default 'con_login'
  check (tipo_contacto in ('publico', 'con_login'));

-- contactar_publicacion ahora permite contacto anónimo cuando la publicación
-- tiene whatsapp_publico=true; si no, sigue exigiendo login.
create or replace function public.contactar_publicacion(p_listing_id uuid)
returns text
language plpgsql
security definer set search_path = ''
as $$
declare
  v_whatsapp text;
  v_publico boolean;
begin
  select pr.whatsapp_number, l.whatsapp_publico into v_whatsapp, v_publico
  from public.listings l
  join public.profiles pr on pr.id = l.publisher_id
  where l.id = p_listing_id and l.status = 'activa';

  if v_whatsapp is null then
    raise exception 'Publicación no encontrada';
  end if;

  if not v_publico and auth.uid() is null then
    raise exception 'Debés iniciar sesión para contactar por WhatsApp';
  end if;

  insert into public.whatsapp_clicks (listing_id, clicked_by, tipo_contacto)
  values (p_listing_id, auth.uid(), case when v_publico then 'publico' else 'con_login' end);

  return v_whatsapp;
end;
$$;

-- El dueño y el staff también tienen que poder cambiar whatsapp_publico
-- después de publicar, no solo al crear.
create or replace function public.mi_update_listing(
  p_listing_id uuid,
  p_nombre text default null,
  p_descripcion text default null,
  p_categoria text default null,
  p_subcategoria text default null,
  p_precio numeric default null,
  p_precio_a_consultar boolean default null,
  p_foto_url text default null,
  p_modalidad text[] default null,
  p_tags text[] default null,
  p_cantidad int default null,
  p_detalles jsonb default null,
  p_zona text default null,
  p_cuadrante text default null,
  p_direccion text default null,
  p_whatsapp_publico boolean default null
)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  v_owner uuid;
begin
  select publisher_id into v_owner from public.listings where id = p_listing_id;
  if v_owner is distinct from auth.uid() then
    raise exception 'No autorizado';
  end if;

  update public.listings set
    nombre = coalesce(p_nombre, nombre),
    descripcion = coalesce(p_descripcion, descripcion),
    categoria = coalesce(p_categoria, categoria),
    subcategoria = coalesce(p_subcategoria, subcategoria),
    precio = coalesce(p_precio, precio),
    precio_a_consultar = coalesce(p_precio_a_consultar, precio_a_consultar),
    foto_url = coalesce(p_foto_url, foto_url),
    modalidad = coalesce(p_modalidad, modalidad),
    tags = coalesce(p_tags, tags),
    cantidad = coalesce(p_cantidad, cantidad),
    detalles = coalesce(p_detalles, detalles),
    zona = coalesce(p_zona, zona),
    cuadrante = coalesce(p_cuadrante, cuadrante),
    direccion = coalesce(p_direccion, direccion),
    whatsapp_publico = coalesce(p_whatsapp_publico, whatsapp_publico),
    updated_at = now()
  where id = p_listing_id;
end;
$$;

create or replace function public.admin_update_listing(
  p_listing_id uuid,
  p_nombre text default null,
  p_descripcion text default null,
  p_categoria text default null,
  p_subcategoria text default null,
  p_precio numeric default null,
  p_precio_a_consultar boolean default null,
  p_foto_url text default null,
  p_modalidad text[] default null,
  p_tags text[] default null,
  p_cantidad int default null,
  p_detalles jsonb default null,
  p_zona text default null,
  p_cuadrante text default null,
  p_direccion text default null,
  p_nota text default null,
  p_whatsapp_publico boolean default null
)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if not public.is_staff(auth.uid()) then
    raise exception 'No autorizado';
  end if;

  update public.listings set
    nombre = coalesce(p_nombre, nombre),
    descripcion = coalesce(p_descripcion, descripcion),
    categoria = coalesce(p_categoria, categoria),
    subcategoria = coalesce(p_subcategoria, subcategoria),
    precio = coalesce(p_precio, precio),
    precio_a_consultar = coalesce(p_precio_a_consultar, precio_a_consultar),
    foto_url = coalesce(p_foto_url, foto_url),
    modalidad = coalesce(p_modalidad, modalidad),
    tags = coalesce(p_tags, tags),
    cantidad = coalesce(p_cantidad, cantidad),
    detalles = coalesce(p_detalles, detalles),
    zona = coalesce(p_zona, zona),
    cuadrante = coalesce(p_cuadrante, cuadrante),
    direccion = coalesce(p_direccion, direccion),
    whatsapp_publico = coalesce(p_whatsapp_publico, whatsapp_publico),
    updated_at = now()
  where id = p_listing_id;

  insert into public.moderacion_log (entity_type, entity_id, actor_id, accion, detalle)
  values ('listing', p_listing_id, auth.uid(), 'edicion', p_nota);
end;
$$;
