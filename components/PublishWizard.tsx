"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { useCategories } from "@/lib/useCategories";
import { CategoryKey, Etiqueta, TipoPublicacion } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

type Intencion = "ofrezco" | "busco";

interface PublishData {
  intencion: Intencion | null;
  tipo: TipoPublicacion | null;
  cat: CategoryKey | null;
  sub: string | null;
  nombre: string;
  desc: string;
  fotosData: string[];
  tags: string;
  precio: string;
  precioConsultar: boolean;
  modalidad: string[];
  etiquetas: Etiqueta[];
  // Producto
  disponibilidad: "recurrente" | "limitada";
  qty: string;
  // Servicio
  zonaCobertura: string;
  disponibilidadServicio: string;
  // Experiencia
  fechaTemporada: string;
  cupos: string;
  duracion: string;
  // Inmueble
  superficie: string;
  mejoras: string;
  // Usado / herramienta
  estadoArticulo: string;
  // Busco
  urgencia: boolean;
  // Ubicación / contacto
  zona: string;
  cuadrante: string | null;
  direccion: string;
  nombreVecino: string;
  whatsapp: string;
  whatsappPublico: boolean;
}

const DEFAULTS: PublishData = {
  intencion: null,
  tipo: null,
  cat: null,
  sub: null,
  nombre: "",
  desc: "",
  fotosData: [],
  tags: "",
  precio: "",
  precioConsultar: false,
  modalidad: [],
  etiquetas: [],
  disponibilidad: "recurrente",
  qty: "",
  zonaCobertura: "",
  disponibilidadServicio: "",
  fechaTemporada: "",
  cupos: "",
  duracion: "",
  superficie: "",
  mejoras: "",
  estadoArticulo: "",
  urgencia: false,
  zona: "",
  cuadrante: null,
  direccion: "",
  nombreVecino: "",
  whatsapp: "",
  whatsappPublico: false,
};

const TIPO_OPTIONS: { value: TipoPublicacion; icon: string; label: string }[] = [
  { value: "producto", icon: "ti-box", label: "Producto" },
  { value: "servicio", icon: "ti-tools", label: "Servicio" },
  { value: "experiencia", icon: "ti-compass", label: "Experiencia" },
  { value: "inmueble", icon: "ti-home", label: "Inmuebles" },
  { value: "usado", icon: "ti-recycle", label: "Usados" },
  { value: "herramienta", icon: "ti-hammer", label: "Herramientas" },
  { value: "otro", icon: "ti-dots", label: "Otro" },
];

function fotoRequerida(d: PublishData): boolean {
  if (d.intencion !== "ofrezco" || !d.tipo) return false;
  return ["producto", "experiencia", "inmueble", "usado", "herramienta"].includes(d.tipo);
}

function stepsFor(d: PublishData): string[] {
  if (!d.intencion) return ["intencion"];
  if (!d.tipo) return ["intencion", "tipo"];
  const steps = ["intencion", "tipo"];
  if (d.tipo !== "otro" && d.tipo !== "herramienta") steps.push("categoria");
  if (d.intencion === "ofrezco") steps.push("datos", "detalles", "ubicacion", "contacto");
  else steps.push("datos", "ubicacion", "contacto");
  return steps;
}

function isValid(step: string, d: PublishData): boolean {
  switch (step) {
    case "intencion":
      return !!d.intencion;
    case "tipo":
      return !!d.tipo;
    case "categoria":
      if (d.tipo === "usado") return !!d.sub;
      return !!d.cat && !!d.sub;
    case "datos":
      return d.nombre.trim() !== "" && d.desc.trim() !== "" && (!fotoRequerida(d) || d.fotosData.length > 0);
    case "detalles":
      return d.modalidad.length > 0;
    case "ubicacion":
      return !!d.zona;
    case "contacto":
      return d.nombreVecino.trim() !== "" && d.whatsapp.trim() !== "";
    default:
      return true;
  }
}

interface PublishWizardProps {
  open: boolean;
  onClose: () => void;
  user: User;
  onPublished: () => void;
  onRequestAnuncio: () => void;
}

export default function PublishWizard({ open, onClose, user, onPublished, onRequestAnuncio }: PublishWizardProps) {
  const { categories, zones } = useCategories();
  const [stepIndex, setStepIndex] = useState(0);
  const [data, setData] = useState<PublishData>(DEFAULTS);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setStepIndex(0);
      setData(DEFAULTS);
      setSubmitError(null);
      const supabase = createClient();
      supabase
        .from("profiles")
        .select("full_name, whatsapp_number")
        .eq("id", user.id)
        .single()
        .then(({ data: profile }) => {
          if (!profile) return;
          setData((prev) => ({
            ...prev,
            nombreVecino: profile.full_name?.trim() || prev.nombreVecino,
            whatsapp: profile.whatsapp_number?.trim() || prev.whatsapp,
          }));
        });
    }
  }, [open, user.id]);

  if (!open) return null;

  const steps = stepsFor(data);
  const step = stepIndex === -1 ? null : steps[stepIndex];
  const pct = step ? Math.round(((stepIndex + 1) / steps.length) * 100) : 100;

  function update<K extends keyof PublishData>(field: K, value: PublishData[K]) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  function toggleModalidad(m: string) {
    setData((prev) => ({
      ...prev,
      modalidad: prev.modalidad.includes(m) ? prev.modalidad.filter((x) => x !== m) : [...prev.modalidad, m],
    }));
  }

  function toggleEtiqueta(e: Etiqueta) {
    setData((prev) => ({
      ...prev,
      etiquetas: prev.etiquetas.includes(e) ? prev.etiquetas.filter((x) => x !== e) : [...prev.etiquetas, e],
    }));
  }

  function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        setData((prev) => ({ ...prev, fotosData: [...prev.fotosData, dataUrl] }));
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  }

  function removeFoto(index: number) {
    setData((prev) => ({ ...prev, fotosData: prev.fotosData.filter((_, i) => i !== index) }));
  }

  async function goNext() {
    if (!step || !isValid(step, data)) return;
    if (stepIndex < steps.length - 1) {
      setStepIndex(stepIndex + 1);
      return;
    }
    await handleSubmit();
  }

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError(null);
    const supabase = createClient();

    try {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name: data.nombreVecino, whatsapp_number: data.whatsapp })
        .eq("id", user.id);
      if (profileError) throw profileError;

      const fotoUrls: string[] = [];
      for (const fotoData of data.fotosData) {
        const blob = await (await fetch(fotoData)).blob();
        const path = `${user.id}/${Date.now()}-${fotoUrls.length}.jpg`;
        const { error: uploadError } = await supabase.storage.from("listing-photos").upload(path, blob, {
          contentType: blob.type || "image/jpeg",
        });
        if (uploadError) throw uploadError;
        fotoUrls.push(supabase.storage.from("listing-photos").getPublicUrl(path).data.publicUrl);
      }
      const fotoUrl = fotoUrls[0] ?? null;

      const detalles: Record<string, unknown> = {};
      let cantidad: number | null = null;
      if (data.intencion === "ofrezco") {
        if (data.tipo === "producto") {
          detalles.disponibilidad = data.disponibilidad;
          if (data.disponibilidad === "limitada" && data.qty) cantidad = Number(data.qty);
        } else if (data.tipo === "servicio") {
          if (data.zonaCobertura) detalles.zona_cobertura = data.zonaCobertura;
          if (data.disponibilidadServicio) detalles.disponibilidad = data.disponibilidadServicio;
        } else if (data.tipo === "experiencia") {
          if (data.fechaTemporada) detalles.fecha = data.fechaTemporada;
          if (data.cupos) detalles.cupos = Number(data.cupos);
          if (data.duracion) detalles.duracion = data.duracion;
        } else if (data.tipo === "inmueble") {
          if (data.superficie) detalles.superficie = data.superficie;
          if (data.mejoras) detalles.mejoras = data.mejoras;
        } else if (data.tipo === "usado" || data.tipo === "herramienta") {
          if (data.estadoArticulo) detalles.estado = data.estadoArticulo;
          if (data.qty) cantidad = Number(data.qty);
        }
      } else if (data.urgencia) {
        detalles.urgencia = true;
      }

      const precioNum = data.intencion === "busco" || data.precio.trim() === "" ? null : Number(data.precio);

      const { data: inserted, error: insertError } = await supabase
        .from("listings")
        .insert({
          publisher_id: user.id,
          intencion: data.intencion!,
          tipo: data.tipo!,
          categoria: data.cat,
          subcategoria: data.sub,
          zona: data.zona,
          cuadrante: data.cuadrante,
          direccion: data.direccion || null,
          nombre: data.nombre,
          descripcion: data.desc,
          foto_url: fotoUrl,
          modalidad: data.modalidad,
          tags: data.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          etiquetas: data.etiquetas,
          cantidad,
          precio: precioNum,
          precio_a_consultar: data.intencion === "busco" ? false : data.precioConsultar,
          whatsapp_publico: data.whatsappPublico,
          detalles,
        })
        .select("id")
        .single();
      if (insertError) throw insertError;

      const extraFotos = fotoUrls.slice(1);
      if (extraFotos.length > 0 && inserted) {
        await supabase.from("listing_images").insert(
          extraFotos.map((url, i) => ({ listing_id: inserted.id, url, orden: i }))
        );
      }

      onPublished();
      setStepIndex(-1);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Algo salió mal, probá de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  function goBack() {
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
    else onClose();
  }

  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;
  const direccionRequiereRetiro = data.tipo === "producto" || data.tipo === "usado" || data.tipo === "herramienta";
  const direccionAplica = !direccionRequiereRetiro || data.modalidad.includes("Retiro");

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-oliva-dd/55 sm:items-center sm:p-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex h-full w-full flex-col bg-white sm:h-auto sm:max-h-[90vh] sm:max-w-md sm:rounded-2xl">
        {stepIndex === -1 ? (
          <div className="flex flex-1 flex-col justify-center px-6 py-10 text-center">
            <i className="ti ti-circle-check mx-auto text-5xl text-oliva" aria-hidden />
            <h3 className="mt-4 font-slab text-lg font-semibold text-tinta">Publicación enviada</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-tinta-suave">
              Ya está activa y visible en el sitio. El equipo puede revisarla, editarla o pausarla más adelante si hace falta.
            </p>
            <button onClick={onClose} className="mx-auto mt-6 rounded-lg bg-oliva px-6 py-2.5 text-[13.5px] font-semibold text-hueso">
              Listo
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-y-auto px-5 pb-4 pt-5 sm:px-6">
              <div className="mb-1.5 h-1 overflow-hidden rounded-full bg-hueso">
                <div className="h-full rounded-full bg-oliva transition-all" style={{ width: `${pct}%` }} />
              </div>
              <p className="mb-4 text-[11px] text-tinta-suave">
                Paso {stepIndex + 1} de {steps.length}
              </p>

              {step === "intencion" && (
                <>
                  <p className="mb-1 font-slab text-lg font-semibold text-tinta">¿Qué querés publicar?</p>
                  <p className="mb-4 text-[13px] text-tinta-suave">Elegí una opción</p>
                  <div className="grid grid-cols-2 gap-2.5">
                    <OptionCard
                      icon="ti-tag"
                      label="Ofrezco algo"
                      selected={data.intencion === "ofrezco"}
                      onClick={() => {
                        update("intencion", "ofrezco");
                        setStepIndex(1);
                      }}
                    />
                    <OptionCard
                      icon="ti-search"
                      label="Busco algo"
                      selected={data.intencion === "busco"}
                      onClick={() => {
                        update("intencion", "busco");
                        setStepIndex(1);
                      }}
                    />
                    <OptionCard
                      icon="ti-speakerphone"
                      label="Publicar un anuncio (evento, aviso, sponsor...)"
                      selected={false}
                      className="col-span-2"
                      onClick={onRequestAnuncio}
                    />
                  </div>
                </>
              )}

              {step === "tipo" && (
                <>
                  <p className="mb-1 font-slab text-lg font-semibold text-tinta">¿Qué tipo de publicación es?</p>
                  <p className="mb-4 text-[13px] text-tinta-suave">Esto define qué datos te vamos a pedir</p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {TIPO_OPTIONS.map((t) => (
                      <OptionCard
                        key={t.value}
                        icon={t.icon}
                        label={t.label}
                        selected={data.tipo === t.value}
                        onClick={() => {
                          update("tipo", t.value);
                          if (t.value === "herramienta") {
                            update("cat", "usados");
                            update("sub", "Herramientas");
                          } else if (t.value === "usado") {
                            update("cat", "usados");
                            update("sub", null);
                          }
                          setStepIndex((i) => i + 1);
                        }}
                      />
                    ))}
                  </div>
                </>
              )}

              {step === "categoria" && (
                <>
                  {data.tipo === "usado" ? (
                    <>
                      <p className="mb-1 font-slab text-lg font-semibold text-tinta">Usados</p>
                      <p className="mb-4 text-[13px] text-tinta-suave">Elegí qué tipo de artículo es</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(categories.usados?.subs || []).filter((s) => s !== "Herramientas").map((s) => (
                          <button
                            key={s}
                            onClick={() => update("sub", s)}
                            className={`rounded-full border px-3 py-1.5 text-xs ${
                              data.sub === s ? "border-dorado bg-dorado text-white" : "border-arena bg-hueso-2 text-tinta"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="mb-1 font-slab text-lg font-semibold text-tinta">Categoría</p>
                      <p className="mb-4 text-[13px] text-tinta-suave">Elegí el rubro y después la subcategoría</p>
                      <div className="mb-3.5 grid grid-cols-2 gap-2">
                        {Object.entries(categories).map(([key, c]) => (
                          <button
                            key={key}
                            onClick={() => {
                              update("cat", key);
                              update("sub", null);
                            }}
                            className={`flex items-center gap-2 rounded-lg border px-2.5 py-2.5 text-left text-[12.5px] text-tinta ${
                              data.cat === key ? "border-2 border-oliva bg-[#F1F4EE]" : "border-piedra/70"
                            }`}
                          >
                            <i className={`ti ${c.icon} text-oliva`} aria-hidden /> {c.label}
                          </button>
                        ))}
                      </div>
                      {data.cat && (
                        <div className="flex flex-wrap gap-1.5">
                          {(categories[data.cat]?.subs || []).map((s) => (
                            <button
                              key={s}
                              onClick={() => update("sub", s)}
                              className={`rounded-full border px-3 py-1.5 text-xs ${
                                data.sub === s ? "border-dorado bg-dorado text-white" : "border-arena bg-hueso-2 text-tinta"
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </>
              )}

              {step === "datos" && (
                <>
                  <p className="mb-4 font-slab text-lg font-semibold text-tinta">Datos de la publicación</p>
                  <Field label="Nombre">
                    <input
                      type="text"
                      placeholder="Ej: Aceite de oliva extra virgen"
                      value={data.nombre}
                      onChange={(e) => update("nombre", e.target.value)}
                      className="w-full rounded-lg border border-piedra/70 px-2.5 py-2.5 text-[13.5px] text-tinta"
                    />
                  </Field>
                  {(data.intencion === "busco" || fotoRequerida(data) || data.tipo === "servicio" || data.tipo === "otro") && (
                    <Field label={fotoRequerida(data) ? "Fotos" : "Fotos (opcional)"}>
                      <PhotoDropzone
                        label={data.intencion === "busco" ? "Foto de referencia si tenés (opcional)" : "Subí una o más fotos reales, como en Mercado Libre"}
                        values={data.fotosData}
                        onChange={handleFoto}
                        onRemove={removeFoto}
                      />
                    </Field>
                  )}
                  <Field label="Descripción">
                    <textarea
                      placeholder={data.intencion === "busco" ? "Contá qué estás buscando" : "Contá brevemente de qué se trata"}
                      value={data.desc}
                      onChange={(e) => update("desc", e.target.value)}
                      className="min-h-[64px] w-full resize-y rounded-lg border border-piedra/70 px-2.5 py-2.5 text-[13.5px] text-tinta"
                    />
                  </Field>
                  {data.intencion === "ofrezco" && (
                    <Field label="Precio">
                      <div className="flex items-center gap-2.5">
                        <input
                          type="number"
                          min={0}
                          placeholder="Monto"
                          disabled={data.precioConsultar}
                          value={data.precio}
                          onChange={(e) => update("precio", e.target.value)}
                          className="w-full rounded-lg border border-piedra/70 px-2.5 py-2.5 text-[13.5px] text-tinta disabled:bg-hueso-2"
                        />
                        <label className="flex flex-shrink-0 items-center gap-1.5 text-[12px] text-tinta">
                          <input
                            type="checkbox"
                            checked={data.precioConsultar}
                            onChange={(e) => update("precioConsultar", e.target.checked)}
                          />
                          A consultar
                        </label>
                      </div>
                    </Field>
                  )}
                  {data.intencion === "busco" && (
                    <Field label="¿Es urgente?">
                      <label className="flex items-center gap-1.5 text-[12.5px] text-tinta">
                        <input type="checkbox" checked={data.urgencia} onChange={(e) => update("urgencia", e.target.checked)} />
                        Sí, lo necesito con urgencia
                      </label>
                    </Field>
                  )}
                  <Field label="Palabras clave (opcional)">
                    <input
                      type="text"
                      placeholder="Separadas por coma. Ej: miel, estepa, artesanal"
                      value={data.tags}
                      onChange={(e) => update("tags", e.target.value)}
                      className="w-full rounded-lg border border-piedra/70 px-2.5 py-2.5 text-[13.5px] text-tinta"
                    />
                    <p className="mt-1 text-[11px] text-tinta-suave">Ayudan a que te encuentren en el buscador.</p>
                  </Field>
                </>
              )}

              {step === "detalles" && (
                <>
                  <p className="mb-4 font-slab text-lg font-semibold text-tinta">Detalles</p>
                  <Field label="¿Cómo se entrega? (elegí una o más)">
                    <div className="flex flex-wrap gap-2">
                      {["A domicilio", "Retiro", "Envío", "Alquiler"].map((m) => (
                        <button
                          key={m}
                          onClick={() => toggleModalidad(m)}
                          className={`rounded-lg border px-3.5 py-2 text-[12.5px] text-tinta ${
                            data.modalidad.includes(m) ? "border-2 border-oliva bg-[#F1F4EE]" : "border-piedra/70"
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </Field>

                  <Field label="Etiquetas (opcional)">
                    <div className="flex flex-wrap gap-2">
                      {([
                        { value: "turismo", label: "Turismo" },
                        { value: "alquileres_temporarios", label: "Alquileres temporarios" },
                      ] as { value: Etiqueta; label: string }[]).map((e) => (
                        <button
                          key={e.value}
                          onClick={() => toggleEtiqueta(e.value)}
                          className={`rounded-full border px-3 py-1.5 text-xs ${
                            data.etiquetas.includes(e.value) ? "border-dorado bg-dorado text-white" : "border-arena bg-hueso-2 text-tinta"
                          }`}
                        >
                          {e.label}
                        </button>
                      ))}
                    </div>
                  </Field>

                  {data.tipo === "producto" && (
                    <Field label="Disponibilidad">
                      <div className="mb-2.5 flex gap-2.5">
                        <button
                          onClick={() => update("disponibilidad", "recurrente")}
                          className={`flex-1 rounded-lg border px-2.5 py-2.5 text-center text-[12.5px] text-tinta ${
                            data.disponibilidad === "recurrente" ? "border-2 border-oliva bg-[#F1F4EE]" : "border-piedra/70"
                          }`}
                        >
                          Recurrente
                          <br />
                          <span className="font-normal">(stock continuo)</span>
                        </button>
                        <button
                          onClick={() => update("disponibilidad", "limitada")}
                          className={`flex-1 rounded-lg border px-2.5 py-2.5 text-center text-[12.5px] text-tinta ${
                            data.disponibilidad === "limitada" ? "border-2 border-oliva bg-[#F1F4EE]" : "border-piedra/70"
                          }`}
                        >
                          Cantidad limitada
                        </button>
                      </div>
                      {data.disponibilidad === "limitada" && (
                        <input
                          type="number"
                          min={1}
                          placeholder="¿Cuántas unidades?"
                          value={data.qty}
                          onChange={(e) => update("qty", e.target.value)}
                          className="w-full rounded-lg border border-piedra/70 px-2.5 py-2.5 text-[13.5px] text-tinta"
                        />
                      )}
                    </Field>
                  )}

                  {data.tipo === "servicio" && (
                    <>
                      <Field label="Zona de cobertura (opcional)">
                        <input
                          type="text"
                          placeholder="Ej: Todo el barrio, o Zona 1 y 2"
                          value={data.zonaCobertura}
                          onChange={(e) => update("zonaCobertura", e.target.value)}
                          className="w-full rounded-lg border border-piedra/70 px-2.5 py-2.5 text-[13.5px] text-tinta"
                        />
                      </Field>
                      <Field label="Disponibilidad (opcional)">
                        <input
                          type="text"
                          placeholder="Ej: Lunes a viernes por la tarde"
                          value={data.disponibilidadServicio}
                          onChange={(e) => update("disponibilidadServicio", e.target.value)}
                          className="w-full rounded-lg border border-piedra/70 px-2.5 py-2.5 text-[13.5px] text-tinta"
                        />
                      </Field>
                    </>
                  )}

                  {data.tipo === "experiencia" && (
                    <>
                      <Field label="Fecha o temporada (opcional)">
                        <input
                          type="text"
                          placeholder="Ej: Todo el año, o Diciembre-Marzo"
                          value={data.fechaTemporada}
                          onChange={(e) => update("fechaTemporada", e.target.value)}
                          className="w-full rounded-lg border border-piedra/70 px-2.5 py-2.5 text-[13.5px] text-tinta"
                        />
                      </Field>
                      <Field label="Cupos (opcional)">
                        <input
                          type="number"
                          min={1}
                          placeholder="Máximo de personas"
                          value={data.cupos}
                          onChange={(e) => update("cupos", e.target.value)}
                          className="w-full rounded-lg border border-piedra/70 px-2.5 py-2.5 text-[13.5px] text-tinta"
                        />
                      </Field>
                      <Field label="Duración (opcional)">
                        <input
                          type="text"
                          placeholder="Ej: 2 horas"
                          value={data.duracion}
                          onChange={(e) => update("duracion", e.target.value)}
                          className="w-full rounded-lg border border-piedra/70 px-2.5 py-2.5 text-[13.5px] text-tinta"
                        />
                      </Field>
                    </>
                  )}

                  {data.tipo === "inmueble" && (
                    <>
                      <Field label="Superficie (opcional)">
                        <input
                          type="text"
                          placeholder="Ej: 8 hectáreas, o 300m²"
                          value={data.superficie}
                          onChange={(e) => update("superficie", e.target.value)}
                          className="w-full rounded-lg border border-piedra/70 px-2.5 py-2.5 text-[13.5px] text-tinta"
                        />
                      </Field>
                      <Field label="Servicios y mejoras (opcional)">
                        <input
                          type="text"
                          placeholder="Ej: luz, agua, forestación"
                          value={data.mejoras}
                          onChange={(e) => update("mejoras", e.target.value)}
                          className="w-full rounded-lg border border-piedra/70 px-2.5 py-2.5 text-[13.5px] text-tinta"
                        />
                      </Field>
                    </>
                  )}

                  {(data.tipo === "usado" || data.tipo === "herramienta") && (
                    <>
                      <Field label="Estado del artículo">
                        <select
                          value={data.estadoArticulo}
                          onChange={(e) => update("estadoArticulo", e.target.value)}
                          className="w-full rounded-lg border border-piedra/70 px-2.5 py-2.5 text-[13.5px] text-tinta"
                        >
                          <option value="">Elegí una opción</option>
                          <option value="Nuevo">Nuevo, sin uso</option>
                          <option value="Muy bueno">Muy bueno</option>
                          <option value="Bueno">Bueno</option>
                          <option value="Para reparar">Para reparar / repuestos</option>
                        </select>
                      </Field>
                      <Field label="Cantidad (opcional)">
                        <input
                          type="number"
                          min={1}
                          placeholder="Ej: 3"
                          value={data.qty}
                          onChange={(e) => update("qty", e.target.value)}
                          className="w-full rounded-lg border border-piedra/70 px-2.5 py-2.5 text-[13.5px] text-tinta"
                        />
                      </Field>
                    </>
                  )}
                </>
              )}

              {step === "ubicacion" && (
                <>
                  <p className="mb-4 font-slab text-lg font-semibold text-tinta">Ubicación</p>
                  <div className="mb-3.5 flex gap-2 rounded-lg bg-[#F7F3EC] p-2.5 text-xs text-tinta-suave">
                    <i className="ti ti-map-pin mt-0.5 flex-shrink-0 text-dorado" aria-hidden />
                    Por ahora la plataforma funciona en El Doradillo. Más adelante se podrán sumar otros barrios.
                  </div>
                  <Field label="Zona">
                    <select
                      value={data.zona}
                      onChange={(e) => update("zona", e.target.value)}
                      className="w-full rounded-lg border border-piedra/70 px-2.5 py-2.5 text-[13.5px] text-tinta"
                    >
                      <option value="">Elegí una zona</option>
                      {zones.map((z) => (
                        <option key={z} value={z}>
                          {z}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Cuadrante (opcional)">
                    <div className="flex gap-1.5">
                      {["Norte", "Sur", "Este", "Oeste"].map((c) => (
                        <button
                          key={c}
                          onClick={() => update("cuadrante", data.cuadrante === c ? null : c)}
                          className={`flex-1 rounded-lg border px-2 py-2 text-center text-xs text-tinta ${
                            data.cuadrante === c ? "border-dorado bg-dorado text-white" : "border-piedra/70"
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </Field>
                  <Field label={direccionAplica ? "Dirección exacta (opcional)" : "Dirección exacta"}>
                    <input
                      type="text"
                      disabled={!direccionAplica}
                      placeholder={direccionAplica ? "Solo si querés que te encuentren fácil" : "No aplica: elegiste solo entrega a domicilio/envío"}
                      value={data.direccion}
                      onChange={(e) => update("direccion", e.target.value)}
                      className="w-full rounded-lg border border-piedra/70 px-2.5 py-2.5 text-[13.5px] text-tinta disabled:bg-hueso-2 disabled:text-piedra"
                    />
                  </Field>
                </>
              )}

              {step === "contacto" && (
                <>
                  <p className="mb-4 font-slab text-lg font-semibold text-tinta">Tus datos de contacto</p>
                  {data.tipo === "inmueble" && (
                    <div className="mb-3.5 flex gap-2 rounded-lg bg-[#FBF3E4] p-2.5 text-xs text-tinta">
                      <i className="ti ti-shield-check mt-0.5 flex-shrink-0 text-dorado" aria-hidden />
                      Las publicaciones de inmuebles pueden requerir autorización adicional del equipo. Te recomendamos
                      completar tu verificación en "Mi perfil" — igual podés enviar tu publicación ahora.
                    </div>
                  )}
                  <div className="mb-3.5 flex gap-2 rounded-lg bg-[#F7F3EC] p-2.5 text-xs text-tinta-suave">
                    <i className="ti ti-brand-whatsapp mt-0.5 flex-shrink-0 text-dorado" aria-hidden />
                    Este es el WhatsApp que va a ver quien te contacte por esta publicación.
                  </div>
                  <Field label="Tu nombre">
                    <input
                      type="text"
                      placeholder="Nombre y apellido"
                      value={data.nombreVecino}
                      onChange={(e) => update("nombreVecino", e.target.value)}
                      className="w-full rounded-lg border border-piedra/70 px-2.5 py-2.5 text-[13.5px] text-tinta"
                    />
                  </Field>
                  <Field label="Tu WhatsApp">
                    <input
                      type="tel"
                      placeholder="+54 9 280 000-0000"
                      value={data.whatsapp}
                      onChange={(e) => update("whatsapp", e.target.value)}
                      className="w-full rounded-lg border border-piedra/70 px-2.5 py-2.5 text-[13.5px] text-tinta"
                    />
                  </Field>
                  <label className="flex items-start gap-2 text-[12.5px] text-tinta">
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={data.whatsappPublico}
                      onChange={(e) => update("whatsappPublico", e.target.checked)}
                    />
                    <span>
                      Mostrar mi WhatsApp sin pedir inicio de sesión
                      <span className="mt-0.5 block text-[11px] text-tinta-suave">
                        Útil para alojamientos, experiencias o gastronomía: cualquier visitante puede contactarte directo.
                        Si lo dejás sin marcar, van a necesitar iniciar sesión para ver tu contacto.
                      </span>
                    </span>
                  </label>
                </>
              )}
            </div>

            {submitError && <p className="bg-white px-5 pt-3 text-[12px] text-red-700 sm:px-6">{submitError}</p>}
            <div className="flex justify-between gap-2.5 border-t border-piedra/40 bg-white px-5 py-3.5 sm:px-6">
              <button onClick={goBack} disabled={submitting} className="rounded-lg border border-piedra/70 px-4 py-2.5 text-[13.5px] text-tinta">
                {isFirst ? "Cancelar" : "Atrás"}
              </button>
              <button
                onClick={goNext}
                disabled={!step || !isValid(step, data) || submitting}
                className="rounded-lg bg-oliva px-5 py-2.5 text-[13.5px] font-semibold text-white disabled:bg-piedra"
              >
                {submitting ? "Publicando..." : isLast ? "Publicar" : "Siguiente"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function OptionCard({ icon, label, selected, onClick, className = "" }: { icon: string; label: string; selected: boolean; onClick: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg border p-3.5 text-center ${selected ? "border-2 border-oliva bg-[#F1F4EE]" : "border-piedra/70"} ${className}`}
    >
      <i className={`ti ${icon} mb-2 block text-2xl text-oliva`} aria-hidden />
      <span className="text-[13px] font-medium text-tinta">{label}</span>
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3.5">
      <label className="mb-1.5 block text-[12.5px] font-medium text-tinta">{label}</label>
      {children}
    </div>
  );
}

function PhotoDropzone({
  label,
  values,
  onChange,
  onRemove,
}: {
  label: string;
  values: string[];
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div>
      <div className="relative rounded-lg border-[1.5px] border-dashed border-piedra/70 p-4 text-center">
        <i className="ti ti-camera text-2xl text-oliva" aria-hidden />
        <p className="mt-2 text-[12.5px] text-tinta">{label}</p>
        <input type="file" accept="image/*" multiple onChange={onChange} className="absolute inset-0 cursor-pointer opacity-0" />
      </div>
      {values.length > 0 && (
        <div className="mt-2.5 grid grid-cols-3 gap-2">
          {values.map((v, i) => (
            <div key={i} className="relative overflow-hidden rounded-lg border border-piedra/70">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={v} alt={`Vista previa ${i + 1}`} className="block h-20 w-full object-cover" />
              <button
                type="button"
                onClick={() => onRemove(i)}
                aria-label="Quitar foto"
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
              >
                <i className="ti ti-x text-xs" aria-hidden />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
