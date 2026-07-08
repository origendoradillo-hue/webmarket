-- Ejecutar en el SQL Editor de Supabase después de las migraciones anteriores.
-- contactar_publicacion no impedía que el propio publicador se contactara a
-- sí mismo — eso generaba un registro en whatsapp_clicks contra su propia
-- publicación, que después disparaba el recordatorio "¿pudiste comunicarte?"
-- sin salida posible (no podés reseñarte a vos mismo).
create or replace function public.contactar_publicacion(p_listing_id uuid)
returns text
language plpgsql
security definer set search_path = ''
as $$
declare
  v_whatsapp text;
  v_publico boolean;
  v_publisher_id uuid;
begin
  select pr.whatsapp_number, l.whatsapp_publico, l.publisher_id into v_whatsapp, v_publico, v_publisher_id
  from public.listings l
  join public.profiles pr on pr.id = l.publisher_id
  where l.id = p_listing_id and l.status = 'activa';

  if v_whatsapp is null then
    raise exception 'Publicación no encontrada';
  end if;

  if v_publisher_id = auth.uid() then
    raise exception 'No podés contactarte a vos mismo';
  end if;

  if not v_publico and auth.uid() is null then
    raise exception 'Debés iniciar sesión para contactar por WhatsApp';
  end if;

  insert into public.whatsapp_clicks (listing_id, clicked_by, tipo_contacto)
  values (p_listing_id, auth.uid(), case when v_publico then 'publico' else 'con_login' end);

  return v_whatsapp;
end;
$$;
