-- Ejecutar en el SQL Editor de Supabase después de las migraciones anteriores.
-- Etapa: completar el sistema de niveles de verificación (bandeja de admin),
-- agregar barrio/zona al perfil de usuario, y cerrar un hueco de seguridad
-- en los permisos de escritura sobre profiles.

-- 1) Barrio/zona del usuario (mismo catálogo de texto libre que usan las publicaciones).
alter table public.profiles add column if not exists zona text;

-- 2) Nota del staff al resolver una solicitud de verificación.
alter table public.user_verifications add column if not exists nota_revision text;

-- 3) Aprobar/rechazar solicitudes de verificación. Si se aprueba, sube el
--    verification_level del usuario al nivel solicitado.
create function public.admin_set_verification_status(p_request_id uuid, p_estado text, p_nota text default null)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  v_user_id uuid;
  v_nivel smallint;
begin
  if not public.is_staff(auth.uid()) then
    raise exception 'No autorizado';
  end if;
  if p_estado not in ('aprobada', 'rechazada') then
    raise exception 'Estado inválido';
  end if;
  select user_id, nivel_solicitado into v_user_id, v_nivel
    from public.user_verifications where id = p_request_id;
  if v_user_id is null then
    raise exception 'Solicitud no encontrada';
  end if;
  update public.user_verifications
    set estado = p_estado, revisado_por = auth.uid(), revisado_en = now(), nota_revision = p_nota
    where id = p_request_id;
  if p_estado = 'aprobada' then
    update public.profiles set verification_level = v_nivel where id = v_user_id;
  end if;
end;
$$;

-- 4) Hueco de seguridad: hoy cualquier usuario autenticado puede actualizar
--    CUALQUIER columna de su propio perfil por la API REST directa (la
--    policy de RLS solo valida la fila, no qué columna se cambia) —
--    incluyendo role, verification_level y blocked_at. Se restringe la
--    escritura directa a las columnas que el front realmente autoedita;
--    todo lo demás sigue yendo por las funciones RPC de admin, que corren
--    con permisos de postgres y no dependen de estos grants.
revoke update on public.profiles from authenticated;
grant update (full_name, whatsapp_number, zona, must_change_password) on public.profiles to authenticated;
