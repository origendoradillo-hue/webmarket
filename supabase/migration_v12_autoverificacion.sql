-- Ejecutar en el SQL Editor de Supabase después de las migraciones anteriores.
-- Etapa: Nivel 2 automático sin costo ni infraestructura nueva. Se otorga
-- solo cuando: el email está confirmado, tiene al menos una publicación
-- activa, y no tiene denuncias vigentes (cualquier denuncia que no haya
-- sido rechazada) sobre sus publicaciones. Nivel 3 sigue siendo exclusivo
-- de aprobación manual del equipo (Etapa de verificaciones).

create or replace function public.check_auto_verification(p_user_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  v_level smallint;
  v_email_verified timestamptz;
  v_has_active_listing boolean;
  v_has_unresolved_report boolean;
begin
  select verification_level, email_verified_at into v_level, v_email_verified
    from public.profiles where id = p_user_id;

  if v_level is null or v_level >= 2 or v_email_verified is null then
    return;
  end if;

  select exists (
    select 1 from public.listings where publisher_id = p_user_id and status = 'activa'
  ) into v_has_active_listing;

  if not v_has_active_listing then
    return;
  end if;

  select exists (
    select 1 from public.listing_reports lr
    join public.listings l on l.id = lr.listing_id
    where l.publisher_id = p_user_id and lr.estado <> 'rechazada'
  ) into v_has_unresolved_report;

  if v_has_unresolved_report then
    return;
  end if;

  update public.profiles set verification_level = 2 where id = p_user_id;

  update public.user_verifications
    set estado = 'aprobada', revisado_en = now(), nota_revision = 'Verificado automáticamente (email confirmado + publicación activa sin denuncias).'
    where user_id = p_user_id and nivel_solicitado = 2 and estado = 'pendiente';
end;
$$;

-- Dispara al confirmarse el email.
create or replace function public.trg_check_auto_verification_profiles()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if new.email_verified_at is not null and old.email_verified_at is null then
    perform public.check_auto_verification(new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists on_profile_email_verified_check_auto on public.profiles;
create trigger on_profile_email_verified_check_auto
  after update on public.profiles
  for each row execute procedure public.trg_check_auto_verification_profiles();

-- Dispara cuando una publicación pasa a "activa" (alta o reactivación).
create or replace function public.trg_check_auto_verification_listings()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if new.status = 'activa' then
    perform public.check_auto_verification(new.publisher_id);
  end if;
  return new;
end;
$$;

drop trigger if exists on_listing_activa_check_auto on public.listings;
create trigger on_listing_activa_check_auto
  after insert or update on public.listings
  for each row execute procedure public.trg_check_auto_verification_listings();

-- Dispara cuando una denuncia cambia de estado (ej. se rechaza y deja de bloquear).
create or replace function public.trg_check_auto_verification_reports()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  v_publisher_id uuid;
begin
  select publisher_id into v_publisher_id from public.listings where id = new.listing_id;
  if v_publisher_id is not null then
    perform public.check_auto_verification(v_publisher_id);
  end if;
  return new;
end;
$$;

drop trigger if exists on_report_resolved_check_auto on public.listing_reports;
create trigger on_report_resolved_check_auto
  after insert or update on public.listing_reports
  for each row execute procedure public.trg_check_auto_verification_reports();
