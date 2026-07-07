-- Ejecutar en el SQL Editor de Supabase después de las migraciones anteriores.
-- Nombre público (nickname) del usuario: se muestra en sus publicaciones en
-- vez del nombre completo. El nombre completo real se sigue usando en el
-- contacto por WhatsApp (mensaje/identidad), nunca se reemplaza ahí.

alter table public.profiles add column if not exists nickname text;

-- El resto de las columnas ya quedaron restringidas en migration_v11 (solo
-- full_name, whatsapp_number, zona, must_change_password son autoeditables);
-- se suma nickname a esa lista.
grant update (nickname) on public.profiles to authenticated;
