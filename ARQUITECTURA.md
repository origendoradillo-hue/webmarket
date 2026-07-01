# Origen El Doradillo — Arquitectura funcional y técnica (v2)

Este documento especifica la versión "guía local + publicaciones verificadas + contacto
directo por WhatsApp" de Origen El Doradillo, con panel de administración y flujo de
revisión editorial. Complementa a `BRIEF.md` (identidad, paleta, prototipo visual).
Ver nota de reconciliación al final sobre diferencias de alcance entre ambos documentos.

Stack: Next.js (React) · Supabase (Postgres + Auth + Storage) · Vercel · sin pagos online.

---

## 1. Roles de usuario

| Rol | Cómo se obtiene | Puede |
|---|---|---|
| **Visitante** | Sin cuenta | Buscar, filtrar, ver publicaciones publicadas, ver perfil público de publicadores. NO ve WhatsApp ni puede favoritos/contactar. |
| **Publicador** | Registro + verificación de WhatsApp por código | Todo lo del visitante + crear/editar sus publicaciones (quedan en `borrador`/`en_revision`), ver WhatsApp de otros, contactar, guardar favoritos, ver métricas propias (clics, vistas) de sus publicaciones. |
| **Publicador verificado** | Admin marca `publisher_profiles.verification_status = verificado` tras validar identidad/vínculo territorial | Todo lo del Publicador + insignia "Verificado" en su perfil. Puede acumular el sello "Selección Origen" en sus publicaciones (solo publicadores verificados son candidatos). No es un permiso técnico extra, es una condición de confianza. |
| **Moderador** | Asignado por Administrador/Superadmin | Ver cola de revisión, aprobar/rechazar/observar publicaciones, gestionar denuncias y soporte, agregar notas internas. NO gestiona usuarios, categorías, zonas, config general ni destacados/sello (eso es de Admin+). |
| **Administrador** | Asignado por Superadmin | Todo lo del Moderador + gestión de usuarios/publicadores, categorías, subcategorías, zonas, destacados, sello "Selección Origen", configuración general, métricas. No puede crear otros Administradores ni tocar configuración técnica sensible (roles de Superadmin, claves, integraciones). |
| **Superadmin** | Fijo (dueño/operador de la plataforma) | Todo. Gestiona Administradores y Moderadores, configuración técnica, puede ver `audit_logs` completos, acceso de emergencia (pausar toda la plataforma, revertir acciones). |

**Regla de seguridad clave:** el cambio de rol de un usuario nunca se hace con un
`UPDATE` directo desde el cliente. Se hace vía función RPC de Postgres
(`SECURITY DEFINER`) invocable solo por `administrador`/`superadmin`, para evitar
escalamiento de privilegios (un Publicador no puede auto-asignarse `moderador`
editando su propio perfil).

Al lanzamiento probablemente solo existan Superadmin (vos) y quizás un Administrador.
Moderador se activa cuando el volumen de publicaciones lo justifique — el esquema de
roles ya lo soporta desde el día uno sin refactor.

---

## 2. Panel de administrador

### 2.1 Dashboard
KPIs de un vistazo: publicaciones en cola de revisión (con antigüedad, alerta si >48h),
publicaciones activas por categoría/zona, denuncias abiertas, solicitudes de soporte
sin atender, clics a WhatsApp últimos 7/30 días, nuevos publicadores últimos 7 días,
publicaciones por vencer (próximos 15 días).

### 2.2 Gestión de publicaciones
Tabla/cola filtrable por: estado, tipo de publicación, categoría, zona, publicador,
tiene sello, es destacada, rango de fechas. Vista de detalle con: datos completos,
historial de cambios de estado (`listing_reviews`), notas internas, botones de acción
según el estado actual (matriz abajo). Edición menor permitida (corregir typo, ajustar
categoría) sin pasar de nuevo por todo el flujo — se registra igual en el historial.

**Estados de una publicación y transiciones permitidas:**

| Estado | Significado | Quién lo dispara | Puede pasar a |
|---|---|---|---|
| `borrador` | El publicador la está armando, no visible | Publicador (auto al crear/guardar) | `en_revision` (al enviar) |
| `en_revision` | Enviada, esperando moderación | Publicador (submit) o reenvío tras `observada` | `publicada`, `observada`, `rechazada` |
| `publicada` | Visible públicamente | Moderador/Admin (aprobar) | `pausada`, `vencida` (automático), `eliminada` |
| `observada` | Requiere cambios antes de aprobar | Moderador/Admin (con nota obligatoria) | `en_revision` (publicador corrige y reenvía) |
| `rechazada` | No cumple criterios, no se publica | Moderador/Admin (con nota obligatoria) | `borrador` (si el publicador quiere reintentar) |
| `pausada` | Publicador o admin la pausa temporalmente | Publicador o Admin | `en_revision` (al reactivar, re-chequeo rápido) |
| `vencida` | Venció el plazo (ej. 6 meses) sin renovación | Sistema (job automático) | `en_revision` (al renovar) |
| `eliminada` | Borrado lógico, no recuperable desde UI pública | Publicador o Admin | (estado final) |

Acciones del admin sobre una publicación: Aprobar, Rechazar, Pedir cambios (observar),
Editar datos menores, Marcar como destacada, Aplicar/retirar sello, Pausar, Eliminar,
Agregar nota interna, Ver historial completo.

### 2.3 Gestión de usuarios/publicadores
Listado con filtros por rol, estado (activo/suspendido), tipo de publicador, zona.
Acciones: ver publicaciones asociadas, ver historial de reportes recibidos, suspender
cuenta (bloquea publicar y contactar, no borra datos), cambiar rol (vía RPC protegida),
marcar/quitar "Publicador verificado", ver auditoría de esa cuenta.

### 2.4 Gestión de categorías
CRUD de `categories` y `subcategories`: nombre, ícono, orden de aparición, activa/inactiva.
No se borran categorías con publicaciones asociadas; se desactivan.

### 2.5 Gestión de zonas
CRUD de `zones` (Zona 1/2/3 del barrio hoy, expandible a otras áreas de la zona rural
norte de Madryn más adelante): nombre, referencia de mapa, orden, activa/inactiva.

### 2.6 Gestión de destacados
`featured_listings`: elegir publicación, posición/orden, fecha inicio/fin, ubicación del
destacado (home / categoría / zona). Vista de calendario simple para ver qué está
destacado y cuándo vence. Incluye los "globos de publicidad" (ver 2.7) — mismo
mecanismo, con etiqueta de origen distinta.

### 2.7 Gestión del carrusel de inicio (banners: publicidad / anuncios / eventos)
Carrusel destacado en el home, separado de los destacados dentro de los listados
(2.6). Administra `home_carousel_items` (ver 3.17): publicidad, anuncios generales del
barrio, y eventos. Reglas clave:

- **Ningún ítem entra activo por defecto.** Toda fila nueva nace en
  `pendiente_moderacion`; el admin/moderador la revisa y recién ahí la pasa a `activo`.
  Esto vale también para eventos: que un evento ya esté `publicada` como publicación
  normal (sección 6) **no** lo mete solo en el carrusel — son dos aprobaciones
  independientes. El usuario nunca publica directo al carrusel.
- Se puede armar a partir de una publicación existente (típicamente un evento) o ser
  contenido propio sin publicación detrás (un anuncio institucional, un flyer de un
  sponsor sin ficha de WhatsApp).
- **"Globos de publicidad" como producto destacado:** son publicaciones reales
  (`listings`) promovidas vía `featured_listings` con `origin = 'publicidad'` — se ven
  igual que un destacado editorial (foto, título, WhatsApp), pero llevan una etiqueta
  visible "Publicidad" para no confundir al usuario con una recomendación orgánica del
  equipo (ver 3.12). Es la puerta de entrada natural a la Fase 3 de monetización de
  `BRIEF.md` (espacios pagos) sin construir nada nuevo cuando llegue ese momento.

### 2.8 Gestión del sello "Selección Origen"
Asignar/retirar el sello a una publicación puntual, con nota de criterio y fecha de
vencimiento (renovación periódica, ej. anual). Ver sección 7 para el detalle funcional.

### 2.9 Reportes/denuncias
Cola de `reports` con estado (`pendiente`/`en_revision`/`resuelto`/`descartado`),
motivo, quién reportó, a qué publicación/publicador. Acción de resolución con nota,
opción de encadenar acción sobre la publicación (pausar/rechazar) directo desde ahí.

### 2.10 Configuración general
Mensaje prearmado de WhatsApp por defecto (con variables `{{titulo}}`), duración por
defecto antes de vencimiento, duración por defecto del sello, textos legales/términos,
umbrales de rate-limiting, activar/desactivar registro de nuevos publicadores (kill
switch de emergencia).

### 2.11 Métricas básicas
Publicaciones por estado/categoría/zona en el tiempo, clics a WhatsApp por publicación
y agregados, publicadores nuevos por período, tiempo promedio en cola de revisión,
tasa de aprobación/rechazo.

---

## 3. Modelo de datos (Supabase / PostgreSQL)

Convenciones: `id uuid default gen_random_uuid()`, timestamps `timestamptz default now()`,
borrado lógico donde aplica (`deleted_at`). `profiles.id` = `auth.users.id`.

### 3.1 `profiles`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | = auth.users.id |
| full_name | text | |
| role | enum(`publicador`,`moderador`,`administrador`,`superadmin`) | default `publicador`; visitante = sin fila/no autenticado |
| is_active | boolean | default true; false = suspendido |
| last_login_at | timestamptz | |
| created_at | timestamptz | |

**Relación:** 1:1 con `auth.users`. 1:1 con `publisher_profiles`.
**Finalidad:** identidad y rol dentro de la plataforma.

### 3.2 `publisher_profiles`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK FK→profiles.id | |
| account_type | enum(`particular`,`emprendimiento`,`comercio`,`profesional`) | condiciona logo/banner y campos como matrícula |
| whatsapp_number | text | formato E.164 |
| whatsapp_verified | boolean | vía código enviado por WhatsApp |
| email | text nullable | |
| zone_id | uuid FK→zones.id | |
| cuadrant | enum(`norte`,`sur`,`este`,`oeste`) nullable | relativo a su propia zona |
| address | text nullable | solo si quiere ser encontrado |
| logo_url | text nullable | solo si account_type ≠ particular |
| banner_url | text nullable | solo si account_type ≠ particular |
| bio | text nullable | |
| verification_status | enum(`no_verificado`,`verificado`) | default `no_verificado` |
| verified_at | timestamptz nullable | |
| verified_by | uuid FK→profiles.id nullable | admin que verificó |
| rating_count | int | default 0. Cantidad de calificaciones reales recibidas |
| rating_sum | int | default 0. Suma cruda de estrellas reales (para promediar) |
| created_at | timestamptz | |

**Relación:** 1:1 con `profiles`, FK a `zones`. 1:N con `listings`, `ratings` (como calificado).
**Finalidad:** datos públicos/comerciales del publicador, separados de la identidad de auth.

**Puntaje mostrado (no es una columna, se calcula al leer):** para que nadie arranque
"en cero" y para evitar que 1-2 calificaciones tempranas (buenas o malas) distorsionen
todo el perfil, se aplica un promedio suavizado con un prior virtual de 4 estrellas:

```
rating_mostrado = (PRIOR_PESO * 4 + rating_sum) / (PRIOR_PESO + rating_count)
```

Con `PRIOR_PESO = 5` (constante de configuración, ajustable desde 2.9). Un publicador
nuevo sin calificaciones muestra **4.0**. A medida que entran calificaciones reales, el
peso del prior se diluye solo — con 5 reales el prior y lo real pesan igual; con 20
reales el prior ya casi no influye. No requiere cron ni job, es una fórmula de lectura.

### 3.3 `categories`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| name | text | ej. "Productores y chacras" |
| icon | text nullable | |
| sort_order | int | |
| is_active | boolean | |

### 3.4 `subcategories`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| category_id | uuid FK→categories.id | |
| name | text | |
| sort_order | int | |
| is_active | boolean | |

**Finalidad de 3.3/3.4:** taxonomía de rubro (independiente del `listing_type`, ver 3.6).

### 3.5 `zones`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| name | text | ej. "Zona 1" |
| map_reference | text nullable | link o referencia a mapa de zonas |
| sort_order | int | |
| is_active | boolean | |

### 3.6 `listings`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| publisher_id | uuid FK→publisher_profiles.id | |
| listing_type | enum(`producto`,`servicio`,`experiencia`,`establecimiento`,`lote_chacra`,`herramienta_usado`,`evento`) | define qué campos de `details` aplican |
| category_id | uuid FK→categories.id | |
| subcategory_id | uuid FK→subcategories.id nullable | |
| zone_id | uuid FK→zones.id | puede diferir del zone_id del publicador |
| title | text | |
| short_description | text | límite ~160 caracteres |
| full_description | text | |
| details | jsonb | campos específicos por tipo (ver sección 5) — evita explosión de tablas por tipo |
| price | numeric nullable | |
| price_unit | text nullable | ej. "por kg", "desde" |
| whatsapp_message_template | text nullable | override del mensaje prearmado global |
| status | enum (ver 2.2) | default `borrador` |
| expires_at | timestamptz nullable | vencimiento automático (ej. +6 meses de `published_at`) |
| published_at | timestamptz nullable | |
| view_count | int | default 0 |
| created_at / updated_at | timestamptz | |

**Relación:** N:1 con `publisher_profiles`, `categories`, `subcategories`, `zones`.
1:N con `listing_images`, `listing_reviews`, `favorites`, `whatsapp_clicks`.
**Finalidad:** tabla central de toda publicación, cualquiera sea su tipo.

*Por qué `details jsonb` y no una tabla por tipo:* con 7 tipos y ~6-10 campos cada uno,
una tabla por tipo es sobre-ingeniería para el volumen esperado. Se valida la forma del
JSON con un esquema (zod) en el server antes de insertar, así se mantiene la integridad
sin 7 tablas y 7 formularios de admin distintos.

### 3.7 `listing_images`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| listing_id | uuid FK→listings.id | |
| storage_path | text | path en Supabase Storage |
| sort_order | int | |
| is_cover | boolean | |
| created_at | timestamptz | |

### 3.8 `listing_reviews`
Historial editorial (distinto de `audit_logs`, que es de toda la plataforma).
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| listing_id | uuid FK→listings.id | |
| reviewer_id | uuid FK→profiles.id | moderador/admin que actuó |
| previous_status | text | |
| new_status | text | |
| note | text nullable | obligatoria si new_status es `observada`/`rechazada` |
| created_at | timestamptz | |

**Finalidad:** trazabilidad de por qué una publicación pasó de un estado a otro,
visible para el admin como "historial de cambios".

### 3.9 `reports`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| target_type | enum(`listing`,`publisher`,`rating`) | |
| listing_id | uuid FK nullable | |
| publisher_id | uuid FK nullable | |
| rating_id | uuid FK→ratings.id nullable | para disputar una calificación de mala fe (ver 3.16) |
| reporter_id | uuid FK→profiles.id nullable | null si se permite reporte anónimo |
| reason | enum(`spam`,`estafa_sospecha`,`info_incorrecta`,`contenido_inapropiado`,`otro`) | |
| description | text | |
| status | enum(`pendiente`,`en_revision`,`resuelto`,`descartado`) | default `pendiente` |
| resolved_by | uuid FK→profiles.id nullable | |
| resolution_note | text nullable | |
| created_at / resolved_at | timestamptz | |

### 3.10 `favorites`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| profile_id | uuid FK→profiles.id | |
| listing_id | uuid FK→listings.id | |
| created_at | timestamptz | |

UNIQUE(`profile_id`, `listing_id`).

### 3.11 `whatsapp_clicks`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| listing_id | uuid FK→listings.id | |
| publisher_id | uuid FK→publisher_profiles.id | denormalizado para métricas rápidas |
| clicked_by | uuid FK→profiles.id | requiere estar logueado/verificado para ver el botón |
| created_at | timestamptz | |

**Finalidad:** medir consultas reales por publicación sin depender de analytics externo.

### 3.12 `featured_listings`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| listing_id | uuid FK→listings.id | |
| placement | enum(`home`,`categoria`,`zona`) | |
| origin | enum(`editorial`,`publicidad`) | `editorial` = elección del admin sin costo (curaduría); `publicidad` = "globo de publicidad" pago o acordado — visualmente igual a un destacado, pero siempre con etiqueta "Publicidad" visible en la card, nunca mezclado sin aclarar |
| sponsor_label | text nullable | nombre a mostrar cuando `origin = 'publicidad'` (ej. "Publicidad de Corralón Zona Norte") |
| sort_order | int | |
| starts_at / ends_at | timestamptz | |
| created_by | uuid FK→profiles.id | |

### 3.13 `origin_selection`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| listing_id | uuid FK→listings.id | |
| granted_by | uuid FK→profiles.id | |
| granted_at | timestamptz | |
| expires_at | timestamptz | renovación periódica (ej. anual) |
| revoked_at | timestamptz nullable | |
| criteria_notes | text nullable | por qué se otorgó (uso interno, no público) |

### 3.14 `audit_logs`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| actor_id | uuid FK→profiles.id | |
| action | text | ej. `role_changed`, `category_updated`, `listing_deleted` |
| entity_type | text | |
| entity_id | uuid | |
| before | jsonb nullable | |
| after | jsonb nullable | |
| created_at | timestamptz | |

**Finalidad:** trazabilidad de acciones administrativas sensibles (cambios de rol,
config, categorías/zonas) — cobertura más amplia que `listing_reviews`.

### 3.15 `support_requests`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| requester_id | uuid FK nullable | null si no está logueado |
| type | enum(`reporte_publicacion`,`solicitud_baja`,`problema_publicador`,`publicacion_incorrecta`,`spam_estafa`,`consulta_general`) | |
| related_listing_id | uuid FK nullable | |
| related_publisher_id | uuid FK nullable | |
| message | text | |
| contact_info | text | email o WhatsApp de quien reporta, para responderle |
| status | enum(`nuevo`,`en_proceso`,`resuelto`,`cerrado`) | default `nuevo` |
| assigned_to | uuid FK→profiles.id nullable | |
| resolution_note | text nullable | |
| created_at / resolved_at | timestamptz | |

### 3.16 `ratings` — reseña bidireccional entre vecinos
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| whatsapp_click_id | uuid FK→whatsapp_clicks.id | ata la calificación a un contacto real, evita calificar sin haber interactuado |
| rater_id | uuid FK→profiles.id | quien califica |
| rated_id | uuid FK→profiles.id | a quien califica (puede ser el publicador o quien contactó — cualquiera de los dos lados) |
| stars | smallint | 1 a 5 |
| tags | text[] | checkboxes fijos, ej. `puntualidad`, `cumplio_lo_acordado`, `buena_comunicacion`, `buena_atencion` — no hay texto libre suelto, siempre acompañado del comentario obligatorio de abajo |
| comment | text **NOT NULL** | obligatorio, mínimo ~20 caracteres, sanitizado y pasado por filtro de lenguaje ofensivo antes de guardar. Sin comentario no se puede enviar la calificación. |
| status | enum(`publicada`,`pendiente_moderacion`,`rechazada`) | ver regla de fricción para negativas abajo |
| moderated_by | uuid FK→profiles.id nullable | quién resolvió una calificación en `pendiente_moderacion` |
| moderated_at | timestamptz nullable | |
| created_at | timestamptz | |

UNIQUE(`whatsapp_click_id`, `rater_id`) — una calificación por persona por contacto.

**Diseño simple pero con freno a calificaciones negativas fáciles:**
- **Comentario obligatorio siempre.** Nadie deja solo estrellas — tiene que explicar en
  texto por qué califica así. Esto ya filtra bastante calificación impulsiva/vacía,
  positiva o negativa.
- **Fricción extra específica para negativas:** toda calificación de **1 o 2 estrellas**
  entra con `status = 'pendiente_moderacion'` (no impacta el agregado todavía) y pasa por
  la misma cola de revisión que denuncias (panel 2.8). Un moderador/admin la lee y decide:
  aprobarla (pasa a `publicada`, ahí sí suma al promedio) o rechazarla (queda oculta, no
  cuenta, se registra el motivo). Las calificaciones de **3 a 5 estrellas** se publican
  solas, sin cola — no tiene sentido hacer cuello de botella con las positivas.
- **Cooldown post-contacto:** no se puede calificar hasta que pasen al menos 2 horas
  desde el `whatsapp_click` — evita la reseña "en caliente" en medio de una discusión
  por WhatsApp.
- **Límite de calificaciones por día por persona** (config general, ej. 5/día) para
  frenar brigading (una sola persona bombardeando calificaciones negativas a varios
  publicadores el mismo día).
- No espera a que ambas partes califiquen ni pregunta "¿se concretó?" — sigue siendo
  simple en ese sentido, la fricción está puesta específicamente contra el abuso, no
  contra el uso normal.
- No se listan calificaciones individuales en público, solo el agregado (rating
  suavizado, ver 3.2) — evita el "señalamiento" público entre vecinos que se cruzan en
  un barrio chico. El comentario obligatorio lo ve el moderador (si entra en cola) y,
  opcionalmente, el propio calificado en su panel privado — nunca en la ficha pública.
- Si igualmente se cuela una calificación de mala fe ya publicada, se puede reportar
  (`reports.target_type = 'rating'`) para que el admin la revierta.
- Un trigger sobre `UPDATE`/`INSERT` en `ratings` (solo cuando `status = 'publicada'`)
  actualiza `publisher_profiles.rating_count` y `rating_sum` del `rated_id` (si no tiene
  fila en `publisher_profiles` todavía, se crea en el mismo insert).

### 3.17 `home_carousel_items` — carrusel de inicio (publicidad / anuncios / eventos)
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| type | enum(`publicidad`,`anuncio`,`evento`) | |
| title | text | |
| image_url | text | flyer/foto/creatividad del slide |
| description | text nullable | texto corto opcional debajo del título |
| listing_id | uuid FK→listings.id nullable | si el slide representa una publicación real (típico en `evento`, o en `publicidad` cuando hay una ficha real detrás) |
| external_url | text nullable | para anuncios/publicidad sin publicación detrás (ej. flyer institucional, link de un sponsor) |
| cta_label | text nullable | ej. "Ver evento", "Más info" |
| sort_order | int | |
| starts_at / ends_at | timestamptz | ventana de exhibición en el carrusel |
| status | enum(`pendiente_moderacion`,`activo`,`pausado`,`rechazado`,`vencido`) | default `pendiente_moderacion` |
| requested_by | uuid FK→profiles.id nullable | si lo pidió un publicador/negocio (futuro espacio pago) |
| approved_by | uuid FK→profiles.id nullable | |
| created_at | timestamptz | |

**Finalidad:** el carrusel del home es una vidriera de alta visibilidad, separada de los
listados normales — por eso tiene su propia gate de moderación en vez de heredar
automáticamente el estado de la publicación de origen. Ningún publicador puede insertar
ni promoverse solo a este espacio: siempre requiere una aprobación explícita del
admin/moderador (`status` nace en `pendiente_moderacion`), incluso si el evento o la
publicación que representa ya está `publicada` por el flujo normal de la sección 6.

---

## 4. Seguridad web

| Medida | Implementación concreta |
|---|---|
| Autenticación | Supabase Auth. Login con WhatsApp/teléfono + código OTP (o email como alternativa). Sesión vía JWT de Supabase. |
| Roles y permisos | Columna `role` en `profiles`, nunca editable directo desde cliente — solo vía RPC `SECURITY DEFINER` restringida a admin/superadmin. |
| Row Level Security | Activado en **todas** las tablas. Ej: `listings` — SELECT público solo si `status='publicada'`; INSERT/UPDATE solo si `publisher_id = auth.uid()` y estado permite edición; admin/mod bypassa vía función `is_admin()` en la policy. |
| Validación de datos | Esquemas Zod compartidos cliente/servidor para el wizard y cada `details` por `listing_type`. Nunca confiar solo en validación de UI. |
| Sanitización de texto | Sanitizar `full_description`/`bio` con una librería tipo `sanitize-html` en el servidor antes de guardar; no permitir HTML libre, solo texto plano con salto de línea. |
| Protección contra spam | Rate limit por IP/usuario en creación de publicaciones y envío de soporte/reportes; honeypot en formularios públicos; Cloudflare Turnstile en registro/contacto si el spam se vuelve problema real. |
| Límite de carga de imágenes | Máx. N fotos por publicación (ej. 8), tamaño máx. por archivo (ej. 5MB), redimensionado/compresión server-side antes de guardar en Storage. |
| Control de tipos de archivo | Whitelist estricta de MIME (`image/jpeg`, `image/png`, `image/webp`); rechazar cualquier otro tipo en el edge function de subida, no confiar en la extensión del archivo. |
| Backups | Point-in-time recovery de Supabase (plan Pro) o dump programado diario si se queda en free tier. |
| Logs de auditoría | Tabla `audit_logs` + trigger/RPC en acciones sensibles de admin. |
| Protección de datos personales | El número de WhatsApp del publicador no se expone en el payload público de listado/búsqueda; se resuelve solo al click de "Contactar" vía una función server-side que registra el clic y devuelve el link `wa.me`, y solo para usuarios logueados/verificados. |
| Reportes y moderación | Botón de reporte en cada publicación/perfil → `reports`, cola visible en panel. |
| HTTPS | Por defecto en Vercel; forzar redirect http→https. |
| Rate limiting | A nivel de Edge Function/API route (ej. con Upstash Redis o una tabla simple de conteo por IP+ventana de tiempo) en endpoints de auth, publicación y contacto. |

---

## 5. Flujo de publicación (wizard)

**Paso 1 — Tipo de publicación:** Producto · Servicio · Experiencia · Establecimiento ·
Lote/chacra/inmueble · Herramienta o usado · Evento. Define qué sub-esquema de `details`
se muestra en el Paso 3.

**Paso 2 — Datos comunes** (todos los tipos): título, categoría, subcategoría, zona,
descripción corta, descripción completa, fotos, nombre del publicador, WhatsApp, tipo de
publicador (particular/emprendimiento/comercio/profesional), horarios o disponibilidad.

**Paso 3 — Campos específicos** (se guardan en `listings.details` jsonb):

| Tipo | Campos |
|---|---|
| Producto | precio, unidad, stock, entrega (sí/no), retiro (sí/no), medios de pago, estado de disponibilidad |
| Servicio | rubro, zona de cobertura, días disponibles, presupuesto, atiende urgencias (bool), precio desde/a consultar, fotos de trabajos, matrícula/habilitación |
| Experiencia | fecha/disponibilidad, duración, cupos, precio, incluye/no incluye, requiere reserva (bool), punto de encuentro, condiciones |
| Establecimiento | tipo de establecimiento, horarios, servicios ofrecidos, ubicación aproximada, admite reservas (bool), web/redes (opcional) |
| Lote/chacra/inmueble | superficie, zona, servicios disponibles (luz/agua/gas), mejoras, precio, estado legal, contacto responsable, ubicación aproximada |
| Herramienta/usado | estado (nuevo/usado), precio, marca/modelo, retiro (sí/no), particular/comercio |
| Evento | fecha, lugar, cupos, precio, organizador, inscripción/reserva |

**Paso 4 (implícito) — Confirmación:** al enviar, `status` pasa de `borrador` a
`en_revision`. El publicador ve un mensaje claro: "tu publicación va a ser revisada
antes de salir al público, normalmente en menos de 48h".

---

## 6. Flujo de revisión

Ver matriz de estados en 2.2. Reglas operativas:

- Nada sale a `publicada` sin paso por `en_revision` (nunca auto-publish).
- `observada` y `rechazada` **requieren** nota (`listing_reviews.note`) — el publicador
  necesita saber qué corregir o por qué no se aceptó.
- Toda transición de estado crea una fila en `listing_reviews` automáticamente
  (trigger o función RPC única `change_listing_status()` que todo el panel usa).
- El admin puede editar campos menores (typos, categoría mal elegida) sin exigir que el
  publicador vuelva a pasar por `en_revision` — se anota igual en el historial.
- Vencimiento (`vencida`) es un job programado (Supabase cron / Edge Function con
  `pg_cron`) que corre diario y marca publicaciones con `expires_at < now()`.
- **Eventos sin atajo:** `listing_type = 'evento'` pasa por exactamente el mismo pipeline
  que cualquier otro tipo — no hay publicación instantánea aunque el evento sea urgente
  o de fecha próxima. Que un evento llegue a `publicada` tampoco lo mete solo en el
  carrusel de inicio (2.7 / 3.17): esa es una segunda aprobación aparte, nunca automática.

---

## 7. Sello "Selección Origen"

Definición funcional (no es certificación oficial ni compra):

- La publicación fue revisada por un humano del equipo, no solo pasó el filtro estándar.
- Los datos de contacto están verificados (WhatsApp real, responde).
- Las fotos son reales del producto/servicio/lugar (no stock, no ilustración genérica).
- El publicador tiene vínculo territorial verificable con la zona.
- La presentación (fotos, descripción) cumple un piso de calidad.
- **Nunca se muestra el ícono aislado** — siempre acompañado del texto "Selección Origen"
  para que no se confunda con un sello de certificación gubernamental/sanitaria.

Implementación: tabla `origin_selection`, asignación manual exclusiva de Admin/Superadmin
desde el detalle de la publicación, con vencimiento (renovación periódica, ej. anual) y
posibilidad de revocar antes de tiempo si deja de cumplir criterios. Es a nivel
**publicación**, no de perfil completo — un publicador puede tener algunas publicaciones
con sello y otras sin él.

---

## 8. Contacto por WhatsApp

- Link generado server-side: `https://wa.me/<numero>?text=<mensaje_urlencoded>`.
- Mensaje prearmado con plantilla global (`{{titulo}}`, config general) u override por
  publicación (`listings.whatsapp_message_template`).
- El número crudo **no viaja** en el payload público de listados/búsqueda; se resuelve al
  click mediante una función server-side que: (1) verifica que el usuario esté logueado y
  verificado, (2) inserta la fila en `whatsapp_clicks`, (3) devuelve el link para redirigir.
- Esto da métrica real de consultas por publicación y por publicador (dashboard admin y
  métricas propias del publicador) sin depender de que el publicador reporte manualmente.
- Cada `whatsapp_click` habilita la reseña bidireccional (sección 3.16): a partir de 2h
  del clic, cualquiera de las dos partes puede calificar a la otra con comentario
  obligatorio — sin pregunta de "¿se concretó?" ni tabla de interacción intermedia.

---

## 9. Soporte

Un único punto de entrada (`support_requests`) con `type` para clasificar:
reporte de publicación, solicitud de baja de cuenta, problema con un publicador,
publicación con datos incorrectos, spam o sospecha de estafa, consulta general.
Formulario simple (tipo, mensaje, contacto), visible tanto logueado como no. La cola cae
en el mismo panel que "Reportes/denuncias" (2.8) para que el admin no tenga que mirar dos
lugares distintos — `reports` es específico de publicación/publicador con flujo de
resolución encadenado a acciones sobre la publicación; `support_requests` cubre todo lo
demás (cuenta, dudas generales, bajas).

---

## 10. Panel de apoyo al desarrollador (donación / "cafecito")

No es parte del marketplace (no es un pago por publicación ni por listing) — es un
botón aparte para que quien quiera bancar el desarrollo lo haga de forma voluntaria.
No requiere procesar tarjetas ni PCI compliance propio: se resuelve con un link de
salida a una plataforma ya armada para esto.

**Recomendación: [Cafecito](https://cafecito.app/).** Es la plataforma equivalente a
"Buy Me a Coffee" pero pensada para Argentina (soporta tarjeta y Mercado Pago, cobra en
pesos, sin fricción de cambio/tarjeta internacional). Pasos:
1. Crear cuenta de creador en Cafecito con tu nombre/alias.
2. Poner un botón "☕ Invitame un cafecito" en el footer del sitio y en una página
   "Acerca del proyecto", que linkea a `https://cafecito.app/tu-usuario` (`target="_blank"`).
3. No hace falta ninguna integración de API para el MVP — es un link de salida simple.

**Alternativa/complemento:** un link de pago de Mercado Pago (o QR estático) con montos
sugeridos, para quien prefiera no salir a otra plataforma. Mismo principio: cero
integración de pagos propia, solo un link externo.

**Tracking opcional (no bloqueante):** tabla `donation_clicks` (`id`, `clicked_by`
nullable, `platform` enum(`cafecito`,`mercadopago`), `created_at`) solo para saber
cuánta gente hace clic — la plataforma nunca ve ni maneja el monto ni la transacción,
eso queda 100% del lado de Cafecito/Mercado Pago.

**Encuadre honesto:** dejar explícito en el texto que acompaña el botón que la
plataforma es y seguirá siendo gratuita para vecinos y publicadores — la donación es
para sostener el desarrollo, no para desbloquear funciones ni destacar publicaciones
(eso ya está cubierto, sin mezclarse, en la Fase 3 de monetización de `BRIEF.md`).

---

## 11. MVP recomendado

**Hacer sí o sí (Fase 1):**
1. Esquema completo de DB (todas las tablas de la sección 3) + RLS desde el día uno,
   aunque al principio solo se usen 2 roles (superadmin + publicador).
2. Auth con verificación de WhatsApp + `profiles`/`publisher_profiles`.
3. Wizard de publicación completo (los 7 tipos, campos en `details` jsonb).
4. Cola de revisión con estados `borrador → en_revision → publicada/observada/rechazada`
   y panel admin mínimo para aprobar/rechazar/observar con nota.
5. Botón de WhatsApp con tracking de clics.
6. Categorías, subcategorías y zonas administrables (aunque el admin las precargue una
   sola vez al lanzar).
7. Reseña bidireccional (`ratings`, sección 3.16): estrellas + comentario obligatorio +
   tags fijos, con moderación previa solo para 1-2 estrellas y cooldown de 2h post-
   contacto. Publicador nuevo muestra 4.0 por el prior suavizado.

**Fase 2 (a las pocas semanas de uso real):**
8. Favoritos.
9. Destacados (`featured_listings`), incluyendo "globos de publicidad" (`origin =
   'publicidad'`).
10. Sello "Selección Origen".
11. Reportes/denuncias + soporte unificado (incluye poder reportar una calificación
    injusta, `reports.target_type = 'rating'`).
12. Métricas del dashboard más allá de conteos básicos.
13. Botón de donación/"cafecito" (sección 10) — es literalmente un link externo, se
    puede sumar en cualquier momento sin dependencias técnicas, no hay motivo para
    esperar más que tener el footer/página "Acerca de" listos.
14. Carrusel de inicio (`home_carousel_items`, 2.7/3.17): publicidad, anuncios y
    eventos curados a mano por el admin — no es crítico para el día uno (el home puede
    lanzar solo con grilla de publicaciones), pero es bajo esfuerzo una vez que el panel
    de revisión ya existe, porque reutiliza la misma cola de moderación.

**Fase 3 (cuando el volumen lo justifique):**
15. Rol Moderador activo (hasta entonces, Admin/Superadmin cubren todo).
16. Vencimiento automático (`vencida`) vía cron — se puede hacer manual al principio si
    el volumen es bajo, automatizar cuando duela hacerlo a mano.
17. `audit_logs` granular en todas las acciones (arrancar solo con las sensibles: cambio
    de rol, borrado, cambios de config).

**Evitar al inicio:**
- Pagos online, carrito, comisión por transacción — el contacto sigue siendo 100% WhatsApp.
- Verificación dura de identidad (DNI). "Publicador verificado" es una marca de confianza
  del admin, no un KYC formal.
- Moderación automatizada con IA — un humano revisando alcanza para el volumen esperado.
- Chat interno en la plataforma.
- Multi-barrio simultáneo — el modelo ya lo permite (`zones` es extensible) pero no hace
  falta activarlo hasta que haya demanda real de otra zona.

**Orden de implementación sugerido:** 1) esquema+auth → 2) wizard de publicación →
3) cola de revisión + panel admin básico → 4) contacto WhatsApp + tracking →
5) categorías/zonas administrables → 6) favoritos/destacados/sello →
7) reportes/soporte → 8) métricas y refinamiento de auditoría.

---

## Nota de reconciliación con `BRIEF.md`

`BRIEF.md` describe una versión más liviana y peer-to-peer (vecinos que ofrecen/buscan,
un solo admin manual, reseñas bidireccionales entre vecinos, sin cola de revisión
editorial). Este documento (v2) es una versión más formal, con jerarquía de roles y
flujo de aprobación editorial obligatorio antes de publicar. Puntos a decidir:

- **Taxonomía doble:** `categories`/`subcategories` (rubro, ej. "Productores y chacras")
  del BRIEF se mantiene intacta; `listing_type` (Producto/Servicio/.../Evento) de este
  documento es una dimensión nueva y ortogonal que no estaba en el BRIEF — ambas convivan
  sin conflicto.
- **Reseñas (resuelto):** se mantiene la reseña bidireccional del BRIEF, pero
  simplificada — tabla `ratings` (3.16) desde Fase 1, sin el mecanismo de ocultamiento
  hasta que ambos califiquen ni el plazo de 5-7 días del BRIEF original, sin comentario
  libre (solo tags fijos) para evitar roces entre vecinos, y con promedio suavizado que
  arranca en 4.0 en vez de 0 para publicadores nuevos (ver fórmula en 3.2). Distinta de
  `listing_reviews`, que es historial editorial interno, no calificación entre usuarios.
- **Moderación:** el BRIEF explícitamente pedía *no* construir un panel de moderación
  complejo al lanzar. Esta especificación sí lo incluye porque fue pedido explícitamente
  para esta versión — se puede lanzar usando solo 2 de los 6 roles (Superadmin +
  Publicador) y activar el resto progresivamente, sin rehacer el esquema.
- **Tipo de publicador:** este documento usa 4 categorías (particular/emprendimiento/
  comercio/profesional) en vez de las 2 del BRIEF (vecino/negocio) — más expresivo,
  compatible hacia atrás (particular ≈ vecino, las otras tres ≈ negocio).
