"use client";

import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Anuncio, AnuncioLayoutType, TipoAnuncio } from "@/lib/types";
import { ANUNCIO_LAYOUT_LABELS, ANUNCIO_LAYOUT_OPTIONS } from "@/lib/anuncioLayouts";
import { resizeImage } from "@/lib/resizeImage";
import AnuncioSlide, { CARTEL_FLYER_ASPECT } from "./AnuncioSlide";
import PhotoCropModal from "./PhotoCropModal";

const TIPO_OPTIONS: { value: TipoAnuncio; label: string }[] = [
  { value: "evento", label: "Evento" },
  { value: "aviso_barrial", label: "Aviso barrial" },
  { value: "sponsor", label: "Sponsor" },
  { value: "promocion", label: "Promoción comercial" },
  { value: "comunicado", label: "Comunicado" },
  { value: "feria", label: "Feria" },
  { value: "novedad", label: "Novedad" },
];

interface AnuncioRequestFormProps {
  open: boolean;
  onClose: () => void;
  user: User;
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  const reader = new FileReader();
  return new Promise((resolve) => {
    reader.onload = (ev) => resolve(ev.target?.result as string);
    reader.readAsDataURL(blob);
  });
}

export default function AnuncioRequestForm({ open, onClose, user }: AnuncioRequestFormProps) {
  const [tipo, setTipo] = useState<TipoAnuncio>("evento");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fecha, setFecha] = useState("");
  const [lugar, setLugar] = useState("");
  const [layoutType, setLayoutType] = useState<AnuncioLayoutType>("full_banner");
  const [imagenData, setImagenData] = useState<string | null>(null);
  const [backgroundData, setBackgroundData] = useState<string | null>(null);
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [whatsappNumero, setWhatsappNumero] = useState("");
  const [redesUrl, setRedesUrl] = useState("");
  const [imagenCropFile, setImagenCropFile] = useState<File | null>(null);
  const [fondoCropFile, setFondoCropFile] = useState<File | null>(null);
  const [tipsOpen, setTipsOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  function reset() {
    setTipo("evento");
    setTitulo("");
    setDescripcion("");
    setFecha("");
    setLugar("");
    setLayoutType("full_banner");
    setImagenData(null);
    setBackgroundData(null);
    setCtaLabel("");
    setCtaUrl("");
    setWhatsappNumero("");
    setRedesUrl("");
    setSent(false);
    setError(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleUploadImagen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImagenCropFile(file);
    e.target.value = "";
  }

  async function handleImagenCropConfirm(blob: Blob) {
    setImagenCropFile(null);
    const resized = await resizeImage(blob);
    setImagenData(await blobToDataUrl(resized));
  }

  function handleUploadFondo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFondoCropFile(file);
    e.target.value = "";
  }

  async function handleFondoCropConfirm(blob: Blob) {
    setFondoCropFile(null);
    const resized = await resizeImage(blob);
    setBackgroundData(await blobToDataUrl(resized));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const supabase = createClient();

    let imagenUrl: string | null = null;
    let backgroundUrl: string | null = null;
    try {
      if (imagenData) {
        const blob = await (await fetch(imagenData)).blob();
        const path = `anuncios/${user.id}/${Date.now()}-flyer.jpg`;
        const { error: upErr } = await supabase.storage.from("listing-photos").upload(path, blob, { contentType: "image/jpeg" });
        if (upErr) throw upErr;
        imagenUrl = supabase.storage.from("listing-photos").getPublicUrl(path).data.publicUrl;
      }
      if (backgroundData) {
        const blob = await (await fetch(backgroundData)).blob();
        const path = `anuncios/${user.id}/${Date.now()}-fondo.jpg`;
        const { error: upErr } = await supabase.storage.from("listing-photos").upload(path, blob, { contentType: "image/jpeg" });
        if (upErr) throw upErr;
        backgroundUrl = supabase.storage.from("listing-photos").getPublicUrl(path).data.publicUrl;
      }
    } catch (err) {
      setSubmitting(false);
      setError(err instanceof Error ? err.message : "No se pudo subir la imagen.");
      return;
    }

    const { error: rpcError } = await supabase.rpc("solicitar_anuncio", {
      p_tipo: tipo,
      p_titulo: titulo,
      p_descripcion: descripcion,
      p_imagen_url: imagenUrl,
      p_fecha_evento: fecha ? new Date(fecha).toISOString() : null,
      p_lugar: lugar || null,
      p_layout_type: layoutType,
      p_background_image_url: backgroundUrl,
      p_cta_label: ctaLabel || null,
      p_cta_url: ctaUrl || null,
      p_whatsapp_numero: whatsappNumero || null,
      p_redes_url: redesUrl || null,
    });
    setSubmitting(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    setSent(true);
  }

  const previewAnuncio: Anuncio = {
    id: "preview",
    tipo,
    titulo: titulo || "Título del anuncio",
    descripcion: descripcion || "Acá va la descripción.",
    imagen: imagenData || undefined,
    fechaEvento: fecha ? new Date(fecha).toISOString() : undefined,
    lugar: lugar || undefined,
    orden: 0,
    ubicacion: "home",
    layoutType,
    backgroundImagen: backgroundData || undefined,
    ctaLabel: ctaLabel || undefined,
    ctaUrl: ctaUrl || undefined,
    whatsappNumero: whatsappNumero || undefined,
    redesUrl: redesUrl || undefined,
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-oliva-dd/55 sm:items-center sm:p-6"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="flex h-full w-full flex-col bg-white sm:h-auto sm:max-h-[90vh] sm:max-w-md sm:rounded-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-piedra/50 bg-white px-4 py-3.5">
          <span className="font-slab text-[13px] font-semibold text-tinta">Publicar un anuncio</span>
          <button onClick={handleClose} aria-label="Cerrar">
            <i className="ti ti-x text-lg text-tinta" aria-hidden />
          </button>
        </div>

        {sent ? (
          <div className="flex flex-1 flex-col justify-center px-6 py-10 text-center">
            <i className="ti ti-circle-check mx-auto text-5xl text-oliva" aria-hidden />
            <h3 className="mt-4 font-slab text-lg font-semibold text-tinta">Solicitud enviada</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-tinta-suave">
              Quedó pendiente de revisión, con todo lo que cargaste. El equipo se pone en contacto con vos (a {user.email})
              antes de publicarlo, o directamente lo aprueba si ya está listo.
            </p>
            <button onClick={handleClose} className="mx-auto mt-6 rounded-lg bg-oliva px-6 py-2.5 text-[13.5px] font-semibold text-hueso">
              Listo
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto px-5 pb-4 pt-5 sm:px-6">
            <div className="mb-4 flex items-start justify-between gap-2">
              <p className="text-[13px] text-tinta-suave">
                Eventos, avisos barriales, sponsors, promociones, comunicados, ferias o novedades — cargá todo lo que
                tengas, el equipo lo revisa antes de que salga.
              </p>
              <button
                type="button"
                onClick={() => setTipsOpen(true)}
                className="flex flex-shrink-0 items-center gap-1 rounded-full border border-dorado/60 px-2.5 py-1 text-[11px] font-medium text-dorado"
              >
                <i className="ti ti-bulb text-xs" aria-hidden />
                Consejos
              </button>
            </div>

            <Field label="Tipo">
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoAnuncio)}
                className="w-full rounded-lg border border-piedra/70 px-2.5 py-2.5 text-[13.5px] text-tinta"
              >
                {TIPO_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Título">
              <input
                required
                type="text"
                placeholder="Ej: Feria de productores de El Doradillo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="w-full rounded-lg border border-piedra/70 px-2.5 py-2.5 text-[13.5px] text-tinta"
              />
            </Field>

            <Field label="Descripción">
              <textarea
                required
                placeholder="Contá de qué se trata"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="min-h-[64px] w-full resize-y rounded-lg border border-piedra/70 px-2.5 py-2.5 text-[13.5px] text-tinta"
              />
            </Field>

            {tipo === "evento" && (
              <>
                <Field label="Fecha (opcional)">
                  <input
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="w-full rounded-lg border border-piedra/70 px-2.5 py-2.5 text-[13.5px] text-tinta"
                  />
                </Field>
                <Field label="Lugar (opcional)">
                  <input
                    type="text"
                    placeholder="Ej: Club de campo, o un link de Google Maps"
                    value={lugar}
                    onChange={(e) => setLugar(e.target.value)}
                    className="w-full rounded-lg border border-piedra/70 px-2.5 py-2.5 text-[13.5px] text-tinta"
                  />
                </Field>
              </>
            )}

            <div className="my-1 border-t border-piedra/30" />

            <Field label="Formato">
              <select
                value={layoutType}
                onChange={(e) => setLayoutType(e.target.value as AnuncioLayoutType)}
                className="w-full rounded-lg border border-piedra/70 px-2.5 py-2.5 text-[13.5px] text-tinta"
              >
                {ANUNCIO_LAYOUT_OPTIONS.map((l) => (
                  <option key={l} value={l}>
                    {ANUNCIO_LAYOUT_LABELS[l]}
                  </option>
                ))}
              </select>
            </Field>

            {layoutType !== "text_only" && (
              <div className="mb-3.5 grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1.5 block text-[12.5px] font-medium text-tinta">
                    {layoutType === "flyer_on_sign" ? "Flyer (opcional)" : "Imagen principal (opcional)"}
                  </label>
                  {imagenData && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={imagenData} alt="" className="mb-1.5 h-16 w-16 rounded object-cover" />
                  )}
                  <input type="file" accept="image/*" onChange={handleUploadImagen} className="w-full text-[11px] text-tinta" />
                </div>
                <div>
                  <label className="mb-1.5 block text-[12.5px] font-medium text-tinta">Imagen de fondo (opcional)</label>
                  {backgroundData && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={backgroundData} alt="" className="mb-1.5 h-16 w-16 rounded object-cover" />
                  )}
                  <input type="file" accept="image/*" onChange={handleUploadFondo} className="w-full text-[11px] text-tinta" />
                </div>
              </div>
            )}

            <div className="mb-3.5 grid grid-cols-2 gap-2">
              <LabeledInput label="Texto del botón (opcional)" value={ctaLabel} onChange={setCtaLabel} placeholder="Ej: Ver más" />
              <LabeledInput label="Link del botón (opcional)" value={ctaUrl} onChange={setCtaUrl} placeholder="https://..." />
            </div>
            <LabeledInput
              label="WhatsApp de contacto (opcional)"
              value={whatsappNumero}
              onChange={setWhatsappNumero}
              placeholder="Solo números con código de área"
            />
            <LabeledInput label="Link de redes (opcional)" value={redesUrl} onChange={setRedesUrl} placeholder="Instagram, Facebook, etc." />

            <div className="mb-3.5 mt-1">
              <p className="mb-1.5 text-[11px] font-medium text-tinta">Así se ve</p>
              <div className="w-[170px] overflow-hidden rounded-xl border border-piedra/50">
                <AnuncioSlide anuncio={previewAnuncio} priority={false} />
              </div>
            </div>

            {error && <p className="mb-3 text-[12px] text-red-700">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="mt-auto w-full rounded-lg bg-oliva py-2.5 text-[13.5px] font-semibold text-hueso disabled:bg-piedra"
            >
              {submitting ? "Enviando..." : "Enviar solicitud"}
            </button>
          </form>
        )}
      </div>
      {imagenCropFile && (
        <PhotoCropModal
          file={imagenCropFile}
          aspect={layoutType === "flyer_on_sign" ? CARTEL_FLYER_ASPECT : undefined}
          title={layoutType === "flyer_on_sign" ? "Flyer para el cartel — formato vertical" : "Imagen principal del anuncio"}
          onConfirm={handleImagenCropConfirm}
          onCancel={() => setImagenCropFile(null)}
        />
      )}
      {fondoCropFile && (
        <PhotoCropModal
          file={fondoCropFile}
          title="Imagen de fondo — formato horizontal"
          onConfirm={handleFondoCropConfirm}
          onCancel={() => setFondoCropFile(null)}
        />
      )}
      {tipsOpen && <AnuncioTipsModal onClose={() => setTipsOpen(false)} />}
    </div>
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

function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <Field label={label}>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-piedra/70 px-2.5 py-2.5 text-[13.5px] text-tinta"
      />
    </Field>
  );
}

function AnuncioTipsModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-stretch justify-center bg-oliva-dd/60 sm:items-center sm:p-6" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="flex h-full w-full flex-col overflow-y-auto bg-white sm:h-auto sm:max-h-[85vh] sm:max-w-md sm:rounded-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-piedra/50 bg-white px-5 py-3.5">
          <span className="font-slab text-[14px] font-semibold text-tinta">Consejos para el anuncio</span>
          <button onClick={onClose} aria-label="Cerrar">
            <i className="ti ti-x text-lg text-tinta" aria-hidden />
          </button>
        </div>
        <div className="flex flex-col gap-4 px-5 py-4">
          <TipSection icon="ti-layout-grid" title="Elegí el formato según lo que tenés">
            <strong className="font-medium text-tinta">Flyer vertical (con cartel):</strong> subís el flyer que ya tenés
            armado (de Instagram, Canva, etc.), formato vertical — se muestra colgado de un cartel de madera de fondo.{" "}
            <strong className="font-medium text-tinta">Banner horizontal:</strong> una sola foto horizontal a pantalla
            completa, con el texto encima. <strong className="font-medium text-tinta">Imagen de fondo + placa:</strong>{" "}
            foto de fondo con el texto en una placa aparte, más legible que el banner si la foto tiene mucho detalle.{" "}
            <strong className="font-medium text-tinta">Solo texto:</strong> para avisos institucionales sin ninguna
            imagen.
          </TipSection>
          <TipSection icon="ti-photo" title="Flyer / imagen principal">
            Si ya tenés un flyer armado, subilo así como está — se recorta a formato vertical automáticamente. Si no
            tenés uno, mirá el instructivo de "Cómo publicar bien" del asistente normal, tiene un prompt para armar uno
            con IA.
          </TipSection>
          <TipSection icon="ti-photo-plus" title="Imagen de fondo">
            Es opcional y va detrás de todo — una foto horizontal, luminosa, sin texto (el texto va encima con un
            degradado). En el formato "Solo texto" no se usa.
          </TipSection>
          <TipSection icon="ti-click" title="Botón, WhatsApp y redes">
            Completá el botón (texto + link) si querés mandar a una web o a la publicación relacionada. Cargá WhatsApp si
            querés que te consulten directo. Ninguno es obligatorio, pero al menos uno ayuda a que el anuncio sirva para
            algo más que informar.
          </TipSection>
          <TipSection icon="ti-eye" title="Revisá la vista previa">
            Abajo del formulario vas viendo cómo queda con lo que cargaste. Si algo no te convence, cambiá el formato o
            volvé a subir la imagen antes de enviar — así el equipo tiene menos que corregir después.
          </TipSection>
        </div>
        <div className="border-t border-piedra/40 px-5 py-3.5">
          <button onClick={onClose} className="w-full rounded-lg bg-oliva py-2.5 text-[13.5px] font-semibold text-hueso">
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}

function TipSection({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 flex items-center gap-1.5 font-slab text-[13px] font-semibold text-tinta">
        <i className={`ti ${icon} text-dorado`} aria-hidden />
        {title}
      </p>
      <p className="text-[12.5px] leading-relaxed text-tinta-suave">{children}</p>
    </div>
  );
}
