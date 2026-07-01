"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { CATEGORIES } from "@/lib/data";
import { CategoryKey } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

type Tipo = "oferta" | "demanda" | "evento";
type Rol = "negocio" | "vecino";

interface PublishData {
  tipo: Tipo | null;
  rol: Rol | null;
  cat: CategoryKey | null;
  sub: string | null;
  nombre: string;
  desc: string;
  fotoData: string | null;
  tags: string;
  modalidad: string[];
  disponibilidad: "recurrente" | "limitada";
  qty: string;
  evNombre: string;
  evFecha: string;
  evLugar: string;
  zona: string;
  cuadrante: string | null;
  direccion: string;
  nombreVecino: string;
  whatsapp: string;
}

const DEFAULTS: PublishData = {
  tipo: null,
  rol: null,
  cat: null,
  sub: null,
  nombre: "",
  desc: "",
  fotoData: null,
  tags: "",
  modalidad: [],
  disponibilidad: "recurrente",
  qty: "",
  evNombre: "",
  evFecha: "",
  evLugar: "",
  zona: "",
  cuadrante: null,
  direccion: "",
  nombreVecino: "",
  whatsapp: "",
};

function stepsFor(tipo: Tipo | null): string[] {
  if (!tipo) return ["tipo"];
  if (tipo === "evento") return ["tipo", "evento", "ubicacion", "contacto"];
  if (tipo === "oferta") return ["tipo", "rol", "categoria", "datos", "detalles", "ubicacion", "contacto"];
  return ["tipo", "categoria", "datos", "ubicacion", "contacto"];
}

function isValid(step: string, d: PublishData): boolean {
  switch (step) {
    case "tipo":
      return !!d.tipo;
    case "rol":
      return !!d.rol;
    case "categoria":
      return !!d.cat && !!d.sub;
    case "datos":
      return d.nombre.trim() !== "" && d.desc.trim() !== "" && (d.tipo === "demanda" || !!d.fotoData);
    case "detalles":
      return d.modalidad.length > 0;
    case "evento":
      return d.evNombre.trim() !== "" && d.evFecha !== "" && d.evLugar.trim() !== "";
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
}

export default function PublishWizard({ open, onClose, user, onPublished }: PublishWizardProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [data, setData] = useState<PublishData>(DEFAULTS);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setStepIndex(0);
      setData(DEFAULTS);
      setSubmitError(null);
    }
  }, [open]);

  if (!open) return null;

  const steps = stepsFor(data.tipo);
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

  function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => update("fotoData", ev.target?.result as string);
    reader.readAsDataURL(file);
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

      let fotoUrl: string | null = null;
      if (data.fotoData) {
        const blob = await (await fetch(data.fotoData)).blob();
        const path = `${user.id}/${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage.from("listing-photos").upload(path, blob, {
          contentType: blob.type || "image/jpeg",
        });
        if (uploadError) throw uploadError;
        fotoUrl = supabase.storage.from("listing-photos").getPublicUrl(path).data.publicUrl;
      }

      const isEvento = data.tipo === "evento";
      const { error: insertError } = await supabase.from("listings").insert({
        publisher_id: user.id,
        tipo_aviso: data.tipo!,
        rol: data.tipo === "oferta" ? data.rol : null,
        categoria: isEvento ? "turismo" : data.cat!,
        subcategoria: isEvento ? "Eventos y celebraciones" : data.sub!,
        zona: data.zona,
        cuadrante: data.cuadrante,
        direccion: data.direccion || null,
        nombre: isEvento ? data.evNombre : data.nombre,
        descripcion: isEvento
          ? `Evento el ${data.evFecha} en ${data.evLugar}.${data.desc ? " " + data.desc : ""}`
          : data.desc,
        foto_url: fotoUrl,
        modalidad: data.modalidad,
        tags: data.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        cantidad: data.disponibilidad === "limitada" && data.qty ? Number(data.qty) : null,
      });
      if (insertError) throw insertError;

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
              Ya quedó guardada. Antes de aparecer en el sitio, alguien del equipo la revisa rápido —
              normalmente en menos de 48h.
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

              {step === "tipo" && (
                <>
                  <p className="mb-1 font-slab text-lg font-semibold text-tinta">¿Qué querés publicar?</p>
                  <p className="mb-4 text-[13px] text-tinta-suave">Elegí el tipo de publicación</p>
                  <div className="grid grid-cols-2 gap-2.5">
                    <OptionCard
                      icon="ti-tag"
                      label="Ofrezco algo"
                      selected={data.tipo === "oferta"}
                      onClick={() => {
                        update("tipo", "oferta");
                        setStepIndex(1);
                      }}
                    />
                    <OptionCard
                      icon="ti-search"
                      label="Busco algo"
                      selected={data.tipo === "demanda"}
                      onClick={() => {
                        update("tipo", "demanda");
                        setStepIndex(1);
                      }}
                    />
                    <OptionCard
                      icon="ti-calendar-event"
                      label="Un evento del barrio"
                      selected={data.tipo === "evento"}
                      className="col-span-2"
                      onClick={() => {
                        update("tipo", "evento");
                        setStepIndex(1);
                      }}
                    />
                  </div>
                </>
              )}

              {step === "rol" && (
                <>
                  <p className="mb-1 font-slab text-lg font-semibold text-tinta">¿Cómo publicás?</p>
                  <p className="mb-4 text-[13px] text-tinta-suave">Esto define si cargás logo y banner, o una foto de producto</p>
                  <div className="flex flex-col gap-2.5">
                    <RolOption
                      icon="ti-building-store"
                      title="Soy un emprendimiento"
                      subtitle="Puedo cargar logo y banner propio"
                      selected={data.rol === "negocio"}
                      onClick={() => {
                        update("rol", "negocio");
                        setStepIndex((i) => i + 1);
                      }}
                    />
                    <RolOption
                      icon="ti-user"
                      title="Es algo puntual"
                      subtitle="Vendo o busco algo suelto, sin marca"
                      selected={data.rol === "vecino"}
                      onClick={() => {
                        update("rol", "vecino");
                        setStepIndex((i) => i + 1);
                      }}
                    />
                  </div>
                </>
              )}

              {step === "categoria" && (
                <>
                  <p className="mb-1 font-slab text-lg font-semibold text-tinta">Categoría</p>
                  <p className="mb-4 text-[13px] text-tinta-suave">Elegí el rubro y después la subcategoría</p>
                  <div className="mb-3.5 grid grid-cols-2 gap-2">
                    {(Object.entries(CATEGORIES) as [CategoryKey, (typeof CATEGORIES)[CategoryKey]][]).map(([key, c]) => (
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
                      {CATEGORIES[data.cat].subs.map((s) => (
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
                  {data.tipo !== "demanda" && (
                    <Field label="Foto">
                      <PhotoDropzone
                        label={data.rol === "negocio" ? "Subí el logo, un flyer o una foto de tu emprendimiento" : "Subí una foto real del producto, como en Mercado Libre"}
                        value={data.fotoData}
                        onChange={handleFoto}
                      />
                    </Field>
                  )}
                  <Field label="Descripción">
                    <textarea
                      placeholder={data.tipo === "demanda" ? "Contá qué estás buscando" : "Contá brevemente de qué se trata"}
                      value={data.desc}
                      onChange={(e) => update("desc", e.target.value)}
                      className="min-h-[64px] w-full resize-y rounded-lg border border-piedra/70 px-2.5 py-2.5 text-[13.5px] text-tinta"
                    />
                  </Field>
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
                  <p className="mb-4 font-slab text-lg font-semibold text-tinta">Modalidad y disponibilidad</p>
                  <Field label="¿Cómo se entrega? (elegí una o más)">
                    <div className="flex flex-wrap gap-2">
                      {["A domicilio", "Retiro", "Envío"].map((m) => (
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
                </>
              )}

              {step === "evento" && (
                <>
                  <p className="mb-4 font-slab text-lg font-semibold text-tinta">Datos del evento</p>
                  <Field label="Nombre del evento">
                    <input
                      type="text"
                      placeholder="Ej: Feria de productores"
                      value={data.evNombre}
                      onChange={(e) => update("evNombre", e.target.value)}
                      className="w-full rounded-lg border border-piedra/70 px-2.5 py-2.5 text-[13.5px] text-tinta"
                    />
                  </Field>
                  <Field label="Fecha">
                    <input
                      type="date"
                      value={data.evFecha}
                      onChange={(e) => update("evFecha", e.target.value)}
                      className="w-full rounded-lg border border-piedra/70 px-2.5 py-2.5 text-[13.5px] text-tinta"
                    />
                  </Field>
                  <Field label="Lugar">
                    <input
                      type="text"
                      placeholder="Ej: Club de campo"
                      value={data.evLugar}
                      onChange={(e) => update("evLugar", e.target.value)}
                      className="w-full rounded-lg border border-piedra/70 px-2.5 py-2.5 text-[13.5px] text-tinta"
                    />
                  </Field>
                  <Field label="Flyer o foto (opcional)">
                    <PhotoDropzone label="Subí un flyer o foto del evento" value={data.fotoData} onChange={handleFoto} />
                  </Field>
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
                      <option value="Zona 1">Zona 1</option>
                      <option value="Zona 2">Zona 2</option>
                      <option value="Zona 3">Zona 3</option>
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
                  <Field label="Dirección exacta (opcional)">
                    <input
                      type="text"
                      placeholder="Solo si querés que te encuentren fácil"
                      value={data.direccion}
                      onChange={(e) => update("direccion", e.target.value)}
                      className="w-full rounded-lg border border-piedra/70 px-2.5 py-2.5 text-[13.5px] text-tinta"
                    />
                  </Field>
                </>
              )}

              {step === "contacto" && (
                <>
                  <p className="mb-4 font-slab text-lg font-semibold text-tinta">Tus datos de contacto</p>
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
                </>
              )}
            </div>

            {submitError && (
              <p className="bg-white px-5 pt-3 text-[12px] text-red-700 sm:px-6">{submitError}</p>
            )}
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

function RolOption({ icon, title, subtitle, selected, onClick }: { icon: string; title: string; subtitle: string; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-3 rounded-lg border p-3.5 text-left ${selected ? "border-2 border-oliva bg-[#F1F4EE]" : "border-piedra/70"}`}>
      <i className={`ti ${icon} text-2xl text-oliva`} aria-hidden />
      <div>
        <span className="block text-[13px] font-medium text-tinta">{title}</span>
        <span className="text-[11.5px] text-tinta-suave">{subtitle}</span>
      </div>
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

function PhotoDropzone({ label, value, onChange }: { label: string; value: string | null; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <div>
      <div className="relative rounded-lg border-[1.5px] border-dashed border-piedra/70 p-4 text-center">
        <i className="ti ti-camera text-2xl text-oliva" aria-hidden />
        <p className="mt-2 text-[12.5px] text-tinta">{label}</p>
        <input type="file" accept="image/*" onChange={onChange} className="absolute inset-0 cursor-pointer opacity-0" />
      </div>
      {value && (
        // eslint-disable-next-line @next/next/no-img-element
        <div className="mt-2.5 overflow-hidden rounded-lg border border-piedra/70">
          <img src={value} alt="Vista previa" className="block max-h-[140px] w-full object-cover" />
        </div>
      )}
    </div>
  );
}
