-- Ejecutar en el SQL Editor de Supabase después de migration_v57_admin_editar_tipo.sql.
--
-- Casi ningún usuario carga el "+54 9" al escribir su WhatsApp, así que
-- el link de wa.me que se arma con ese número nunca abre un chat válido.
-- El código ahora agrega ese prefijo solo al guardar (lib/whatsapp.ts,
-- normalizeWhatsappNumber) — esta migración aplica la misma normalización
-- una sola vez a los números ya guardados, para que los perfiles y
-- anuncios existentes queden arreglados sin que cada usuario tenga que
-- volver a cargar su WhatsApp a mano.
--
-- Mismo criterio que la función JS: solo dígitos; si ya empieza con "54"
-- se deja igual; si empieza con "9" (typeó el 9 pero no el 54) se le
-- antepone "54"; si no tiene ninguno de los dos, se le antepone "549".

update public.profiles
set whatsapp_number = case
  when regexp_replace(whatsapp_number, '\D', '', 'g') like '54%' then regexp_replace(whatsapp_number, '\D', '', 'g')
  when regexp_replace(whatsapp_number, '\D', '', 'g') like '9%' then '54' || regexp_replace(whatsapp_number, '\D', '', 'g')
  else '549' || regexp_replace(whatsapp_number, '\D', '', 'g')
end
where whatsapp_number is not null and trim(whatsapp_number) <> '';

update public.anuncios
set whatsapp_numero = case
  when regexp_replace(whatsapp_numero, '\D', '', 'g') like '54%' then regexp_replace(whatsapp_numero, '\D', '', 'g')
  when regexp_replace(whatsapp_numero, '\D', '', 'g') like '9%' then '54' || regexp_replace(whatsapp_numero, '\D', '', 'g')
  else '549' || regexp_replace(whatsapp_numero, '\D', '', 'g')
end
where whatsapp_numero is not null and trim(whatsapp_numero) <> '';
