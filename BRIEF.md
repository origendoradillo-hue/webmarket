# Origen El Doradillo — Brief técnico para desarrollo

Plataforma web tipo guía/directorio local para conectar vecinos, productores, oficios,
turismo y eventos en la zona rural norte de Puerto Madryn (Parque Ecológico El Doradillo
y alrededores). Barrio de chacras, ~800 habitantes, densidad muy baja (28 hab/km²).

Hay un prototipo HTML funcional (sin backend) ya construido: `prototipo-referencia.html`.
Sirve como referencia visual y de interacción exacta — layout, textos, comportamiento de
filtros, y el formulario de publicar completo paso a paso. Todo lo descripto acá ya está
resuelto visualmente ahí.

---

## 1. Identidad de marca

**Nombre:** Origen El Doradillo
**Bajada oficial:** "Productos, servicios y experiencias con origen en la zona rural norte de Madryn."

**Paleta:**
| Color | Hex | Uso |
|---|---|---|
| Hueso | `#F2EDE4` | Fondo base general |
| Arena tostada | `#C9A672` | Acentos cálidos |
| Oliva profundo | `#4A5D3A` | Color primario, botones, marca |
| Oliva oscuro | `#33402A` / `#1C261C` | Hero, footer, fondos oscuros |
| Nogal | `#5C3D2E` | Texto, detalles |
| Piedra | `#9B9184` | Texto secundario, bordes |
| Golfo apagado | `#4C6B70` | Acento frío |
| Dorado seco | `#B8863E` | Detalle, CTAs, sello |

**Tipografía:** Bitter (slab serif, para "Origen" y títulos) + Barlow (sans, para todo el resto).
Se cargan por Google Fonts. Estilo buscado: "western moderno" — sobrio, territorial,
sin cliché de rodeo/saloon.

**Logo:** ver `/assets/logo/`. Hay versión completa (ícono + wordmark) y versión compacta
(solo el ícono de sol + horizonte, para espacios chicos tipo header/favicon). Ambas en
fondo oliva original y en versión transparente.

**Sello "Selección Origen El Doradillo":** distintivo de calidad curado manualmente
(no comprable, no automático). Ver `/assets/sello/` — versión oscura y clara.
Regla de negocio: lo otorga el administrador tras conocer al productor/oferente;
tiene renovación periódica (ej. anual); nunca se muestra sin el texto que lo acompaña
(para que no se lea como un ícono de "foco encendido" aislado).

---

## 2. Modelo de datos

### Vecino
```
id, nombre, whatsapp (verificado por código), email (opcional),
zona ("Zona 1" | "Zona 2" | "Zona 3"),          // obligatorio
cuadrante ("Norte"|"Sur"|"Este"|"Oeste"|null),   // opcional
direccion (texto libre, opcional),               // opcional, solo si quiere ser encontrado
barrio (default "El Doradillo"),                 // pensado para expandir a otros barrios después
tipo_cuenta ("negocio" | "vecino"),              // negocio puede cargar logo+banner; vecino no
logo (imagen, solo si tipo_cuenta="negocio"),
banner (imagen, solo si tipo_cuenta="negocio"),
fecha_registro
```
No hay verificación dura (sin DNI). La confirmación es por código enviado al WhatsApp.
El control de calidad real es social: rating + reportes de la propia comunidad.

### Publicación
```
id, vecino_id (dueño),
tipo ("oferta" | "demanda" | "evento"),
categoria, subcategoria (ver listado abajo),
nombre, descripcion,
fotos (1 a N; para "vecino" tipo_cuenta debe ser foto real del producto,
        estilo Mercado Libre — no ilustración ni flyer de marca),
modalidad ([ "A domicilio", "Retiro", "Envío" ]),   // multi-select
disponibilidad ("recurrente" | "limitada"),
cantidad (número, solo si disponibilidad="limitada"; nunca se muestra en la
          tarjeta principal, solo al abrir el detalle),
estado ("activa" | "pausada" | "cerrada"),
// específico para tipo="evento":
fecha_evento, lugar_evento,
zona_override / direccion_override (opcional, si difiere del perfil del vecino),
fecha_publicacion
```

### Interacción (contacto)
```
id, publicacion_id, demandante_id,
fecha_contacto (se registra automático al tocar "Contactar por WhatsApp"),
concretado (null | true | false)   // se pregunta ~5-7 días después: "¿se concretó?"
```
Esto es lo que dispara (o no) el pedido de reseña. Evita pedir reseña de contactos
que solo fueron una consulta de precio sin concretarse.

### Reseña
```
id, interaccion_id, autor_id, destinatario_id,
estrellas (1-5),
tags (checkboxes tipo "Puntualidad", "Cumplió lo acordado", "Buena comunicación" —
      NO texto libre abierto por defecto, para evitar agresividad entre vecinos),
comentario_corto (opcional, con filtro de lenguaje ofensivo),
visible (boolean — oculta hasta que AMBAS partes califiquen o venza un plazo de 7 días)
```
Reseña bidireccional: oferente y demandante se califican mutuamente. Solo se muestra
el promedio + cantidad de reseñas en la publicación, no el detalle uno por uno
(para no generar "señalamiento" en un barrio chico donde todos se cruzan).
Derecho a réplica corta ante una calificación con la que no se está de acuerdo.

---

## 3. Tipo, Categoría y Subcategoría

La clasificación de una publicación es una sola jerarquía anidada, no tres ejes
paralelos: **Tipo de publicación → Categoría → Subcategoría (opcional)**. Categoría
depende del Tipo elegido (cada Tipo tiene su propio set de categorías; no es una
lista global fija), y Subcategoría depende de la Categoría y nunca es obligatoria.
No existe un sistema de "Etiquetas" transversal aparte — cualquier concepto que
antes vivía como etiqueta (turismo, alquileres temporarios) queda representado
como categoría/subcategoría dentro del Tipo que corresponde.

| Tipo | Categoría | Subcategorías |
|---|---|---|
| Producto, Emprendimiento | Productores y chacras | Verduras y frutas, Huevos y lácteos, Miel y dulces, Plantas y vivero, Forrajería, Otros de chacra |
| Producto, Emprendimiento | Gastronomía | Panificados, Conservas y ahumados, Bebidas, Otros alimentos |
| Producto, Emprendimiento | Instrumentos | Percusión, Cuerdas, Vientos, Accesorios |
| Producto, Emprendimiento | Otros productos | — |
| Servicio, Emprendimiento | Oficios y servicios | Plomería, Electricidad, Gasista, Jardinería, Limpieza, Cuidado de mascotas, Otros oficios |
| Servicio, Emprendimiento | Construcción y ramos generales | Albañilería, Herrería, Pintura, Provisión de materiales |
| Servicio, Emprendimiento | Otros servicios | — |
| Experiencia | Turismo y experiencias | Cabalgatas, Avistaje de fauna, Paseos guiados, Degustaciones, Talleres, Otras experiencias |
| Inmueble | Hotelería y hospedaje | Cabañas, Habitaciones, Casas completas |
| Inmueble | Alquiler permanente | — |
| Inmueble | Venta | — |
| Inmueble | Terrenos y chacras | — |
| Usado | Herramientas | — |
| Usado | Instrumentos | — |
| Usado | Muebles y hogar | — |
| Usado | Vehículos | — |
| Usado | Otros usados | — |
| Otro | Varios | — |

"Emprendimiento" no tiene categorías propias: reutiliza las de Producto y Servicio
(cada categoría de esos dos Tipos también pertenece a Emprendimiento). Esto se
modela en la base con `categories.tipo_scope` (array de Tipos, no un Tipo único),
así que una categoría puede pertenecer a más de un Tipo sin duplicar la fila.

Categorías y subcategorías viven en las tablas `categories`/`subcategories`
(editables desde el panel admin, sección "Categorías"), no hardcodeadas en el
frontend. Tipo es un enum fijo (`lib/tipos.ts`), porque gobierna qué campos pide
el formulario de publicar (foto obligatoria, precio, dirección, etc.), no algo que
un admin deba poder crear libremente.

---

## 4. Ubicación (zona / cuadrante / dirección / barrio)

Sistema en capas, cada nivel más preciso pero opcional salvo el primero:

1. **Zona** (obligatoria): Zona 1 / 2 / 3, según el loteo original del barrio
   (ver `/assets/mapa/mapa-zonas-barrio.png`).
2. **Cuadrante** (opcional): Norte / Sur / Este / Oeste dentro de la zona propia
   del vecino (no un cuadrante global del barrio entero).
3. **Dirección exacta** (opcional): texto libre, solo si el vecino quiere ser
   encontrado fácil (típicamente quienes reciben "Retiro").
4. **Barrio**: hoy fijo en "El Doradillo", pero el campo existe para poder sumar
   otros barrios cercanos más adelante sin rehacer el modelo. Este dato se muestra
   por publicación, no como algo global de toda la plataforma.
5. **Google Maps** (opcional): si el vecino cargó dirección, se genera un link de
   búsqueda de Google Maps automático (no requiere API, es un link de búsqueda simple).

---

## 5. Flujo de registro y publicación

**Registro:** automático, sin fricción, sin verificación dura.
Nombre + WhatsApp + Zona (obligatorios) → resto opcional → código de 6 dígitos
por WhatsApp para confirmar. Sin confirmar, puede navegar y buscar, pero no
publicar ni ver datos de contacto de otros.

**Publicar** (wizard de varios pasos — ya implementado visualmente en el prototipo,
función `renderPublish()` / `pubSteps()` del HTML):

1. Tipo: Ofrezco algo / Busco algo / Evento del barrio
2. *(solo si "ofrezco")* Rol: Emprendimiento (logo+banner) vs. Particular (foto de
   producto real, sin marca)
3. Categoría → Subcategoría
4. Nombre, foto(s), descripción
5. *(oferta/demanda)* Modalidad + disponibilidad — *(evento)* fecha + lugar + flyer
6. Ubicación (zona/cuadrante/dirección)
7. Contacto (nombre + WhatsApp) → confirmación

**Diferenciación oferente vs. particular** (importante, ya resuelta en el diseño):
- **Emprendimiento**: puede tener logo (avatar circular) + banner (franja de marca,
  visible en el detalle, NO como fondo de la foto principal) — la foto principal
  del producto sigue siendo prioritaria si existe.
- **Particular / producto aislado**: sin logo ni banner, avatar genérico de persona,
  la foto es obligatoriamente una foto real del objeto (como Mercado Libre), con
  una etiqueta "Particular" visible en la tarjeta.

---

## 6. Reglas de negocio a implementar en el backend (no existen en el prototipo estático)

- **Auto-expiración**: cada ~6 meses, o cuando `disponibilidad="limitada"` y
  `cantidad` llega a 0, la publicación se pausa sola o se pregunta "¿seguís
  ofreciendo esto?" al vecino. Es la solución al problema de "la gente no borra
  sus publicaciones viejas".
- **Orden del listado**: las publicaciones con logo + banner (más "completas")
  aparecen primero, luego por rating. Esto ya está en el prototipo (función
  `applyFilters` → `.sort()`), replicar la misma lógica en el backend/query.
- **Disparador de reseña**: 5-7 días después del primer contacto, preguntar al
  demandante si se concretó; solo ahí se habilita la reseña bidireccional oculta.
- **Moderación**: al lanzamiento, un solo administrador (manual) alcanza para
  800 habitantes. No sobre-construir un panel de moderación complejo todavía.

---

## 7. Monetización (fases, no todo de una)

| Fase | Qué incluye | Cuándo |
|---|---|---|
| 1 — Lanzamiento | Directorio + agenda de eventos, todo gratis | Ahora |
| 2 — Validación | Igual, con uso real, sin cobrar nada | +2-3 meses |
| 3 — Monetización | Publicaciones destacadas pagas, membresías para negocios,
   espacio de auspicio en la agenda de eventos | Cuando haya tracción real |

Reglas fijas: la publicación básica es gratis para siempre (nunca "gratis-trampa"
temporal). Nunca se cobra por publicar lo esencial. El sello "Selección Origen"
nunca se compra. No hay comisión por transacción (la plata nunca pasa por la
plataforma, es contacto directo por WhatsApp).

---

## 8. Recomendación técnica

- **Backend + auth + storage de fotos**: Supabase (gratis para este volumen,
  incluye Postgres + autenticación + storage de archivos).
- **Frontend**: reconstruir sobre la base visual del prototipo HTML (mismo
  sistema de diseño, colores, tipografía, componentes) — no hace falta rediseñar,
  solo conectar a datos reales.
- **Hosting**: Vercel o Netlify (gratis en este volumen), dominio propio después
  (mismo patrón que ya usás con madrynnorte.com.ar vía NIC.ar + Cloudflare DNS).
- **Autenticación WhatsApp**: código por SMS/WhatsApp (hay servicios como Twilio
  o directamente WhatsApp Business API; evaluar costo según volumen — con 800
  habitantes el volumen es bajo).

---

## 9. Qué NO construir todavía (evitar sobre-ingeniería en el arranque)

- Pagos online / carrito de compra (nunca — el modelo es "clasificado con
  contacto directo", no e-commerce).
- Verificación dura de identidad (DNI, comprobante de domicilio).
- Sistema de moderación automatizado con IA — empezar con un admin humano.
- Múltiples barrios simultáneos — el campo existe pero solo El Doradillo está
  activo al lanzamiento.
- Chat interno en la plataforma — el contacto es y seguirá siendo WhatsApp externo.

---

## Archivos incluidos en esta carpeta

```
/assets/logo/       → logo completo y marca compacta, con y sin fondo
/assets/sello/       → sello "Selección Origen" oscuro y claro
/assets/mapa/         → mapa de zonas del barrio (Zona 1/2/3)
/assets/fotos-ejemplo/ → 15 fotos usadas como datos de ejemplo en el prototipo,
                          organizadas por publicación (útiles para poblar la
                          base de datos de prueba durante el desarrollo)
prototipo-referencia.html → el prototipo funcional completo (abrir en cualquier
                             navegador), referencia exacta de diseño y de todo
                             el flujo de "Publicar"
```
