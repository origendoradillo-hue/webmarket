-- Ejecutar en el SQL Editor de Supabase después de las migraciones anteriores.
-- Etapa 15: soporte — el formulario "Escribinos" del pie de página pasa a
-- guardarse de verdad (antes era solo un mensaje de éxito local, sin backend).

create table public.support_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  nombre text not null,
  contacto text not null,
  mensaje text not null,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'resuelta')),
  created_at timestamptz not null default now(),
  resuelto_por uuid references public.profiles(id),
  resuelto_en timestamptz
);

alter table public.support_requests enable row level security;

create policy "Staff ve las solicitudes de soporte"
  on public.support_requests for select
  to authenticated
  using (public.is_staff(auth.uid()));

-- Cualquiera (logueado o anónimo) puede escribir, pero solo a través de esta
-- función — no hay policy de insert directa sobre la tabla.
create function public.crear_solicitud_soporte(p_nombre text, p_contacto text, p_mensaje text)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if trim(p_nombre) = '' or trim(p_contacto) = '' or trim(p_mensaje) = '' then
    raise exception 'Completá todos los campos';
  end if;
  insert into public.support_requests (user_id, nombre, contacto, mensaje)
  values (auth.uid(), trim(p_nombre), trim(p_contacto), trim(p_mensaje));
end;
$$;

create function public.admin_set_support_request_status(p_request_id uuid, p_estado text)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if not public.is_staff(auth.uid()) then
    raise exception 'No autorizado';
  end if;
  if p_estado not in ('pendiente', 'resuelta') then
    raise exception 'Estado inválido';
  end if;

  update public.support_requests
  set estado = p_estado,
      resuelto_por = case when p_estado = 'resuelta' then auth.uid() else null end,
      resuelto_en = case when p_estado = 'resuelta' then now() else null end
  where id = p_request_id;
end;
$$;
