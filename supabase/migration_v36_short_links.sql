-- Ejecutar en el SQL Editor de Supabase después de migration_v35_subtitulo_regalo.sql.
-- Los links de publicaciones/anuncios son muy largos para compartir por
-- WhatsApp (UUID completo). Se agrega un código corto (7 caracteres,
-- alfabeto sin 0/O/1/l/I para que no se confundan al leerlos/tipearlos)
-- y una ruta /p/<codigo> que redirige a la publicación o anuncio
-- correspondiente. Los links largos existentes (/publicacion/<uuid>,
-- /anuncio/<uuid>) siguen funcionando exactamente igual.

create or replace function public.generate_short_code()
returns text
language plpgsql
as $$
declare
  chars text := '23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
  code text;
  i int;
begin
  loop
    code := '';
    for i in 1..7 loop
      code := code || substr(chars, (floor(random() * length(chars)) + 1)::int, 1);
    end loop;
    exit when not exists (select 1 from public.listings where short_code = code)
      and not exists (select 1 from public.anuncios where short_code = code);
  end loop;
  return code;
end;
$$;

alter table public.listings add column if not exists short_code text;
alter table public.anuncios add column if not exists short_code text;

update public.listings set short_code = public.generate_short_code() where short_code is null;
update public.anuncios set short_code = public.generate_short_code() where short_code is null;

alter table public.listings alter column short_code set not null;
alter table public.anuncios alter column short_code set not null;
alter table public.listings add constraint listings_short_code_key unique (short_code);
alter table public.anuncios add constraint anuncios_short_code_key unique (short_code);

alter table public.listings alter column short_code set default public.generate_short_code();
alter table public.anuncios alter column short_code set default public.generate_short_code();

-- El código corto no es sensible (no identifica al dueño ni da acceso a
-- nada que la publicación/anuncio ya activo no muestre públicamente), así
-- que se puede leer sin restricción — igual que el resto de las columnas
-- públicas de listings/anuncios.
