"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Cropper, { Area } from "react-easy-crop";
import { cropToBlob } from "@/lib/cropToBlob";

interface PreviewPanel {
  label: string;
  render: (previewUrl: string) => React.ReactNode;
}

interface PhotoCropModalProps {
  file: File;
  aspect?: number;
  previewPanels?: PreviewPanel[];
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
}

// Editor de recorte/zoom antes de subir una foto — se intercala entre
// "elegir archivo" y el resize/compresión que ya existía (lib/resizeImage.ts),
// que sigue aplicándose después sobre el blob recortado.
export default function PhotoCropModal({ file, aspect, previewPanels, onConfirm, onCancel }: PhotoCropModalProps) {
  const [imageSrc] = useState(() => URL.createObjectURL(file));
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [working, setWorking] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => URL.revokeObjectURL(imageSrc), [imageSrc]);
  useEffect(
    () => () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    []
  );

  // Además de guardar el recorte, si hay paneles de vista previa se
  // regenera (con un debounce chico para no recalcular en cada frame de
  // un arrastre) un blob recortado "en vivo" para mostrar cómo va a
  // quedar antes de confirmar.
  const onCropComplete = useCallback(
    (_croppedArea: Area, pixels: Area) => {
      setCroppedAreaPixels(pixels);
      if (!previewPanels || previewPanels.length === 0) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        const blob = await cropToBlob(imageSrc, pixels);
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = url;
        setPreviewUrl(url);
      }, 200);
    },
    [imageSrc, previewPanels]
  );

  async function handleConfirm() {
    if (!croppedAreaPixels) return;
    setWorking(true);
    const blob = await cropToBlob(imageSrc, croppedAreaPixels);
    setWorking(false);
    if (blob) onConfirm(blob);
  }

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-black">
      <div className="relative flex-1">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspect || 4 / 3}
          cropShape="rect"
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>
      {previewPanels && previewPanels.length > 0 && (
        <div className="flex max-h-[38vh] flex-shrink-0 gap-4 overflow-auto bg-oliva-dd/70 px-4 py-3">
          {previewPanels.map((panel, i) => (
            <div key={i} className="flex flex-shrink-0 flex-col items-center gap-1.5">
              <span className="text-[10.5px] text-white/80">{panel.label}</span>
              {previewUrl ? (
                panel.render(previewUrl)
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded border border-white/20 text-[10px] text-white/50">
                  ...
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-col gap-3 bg-oliva-dd px-5 py-4">
        <div className="flex items-center gap-2.5">
          <i className="ti ti-zoom-out text-sm text-white/70" aria-hidden />
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-dorado"
            aria-label="Zoom"
          />
          <i className="ti ti-zoom-in text-sm text-white/70" aria-hidden />
        </div>
        <div className="flex justify-between gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border border-white/30 py-2.5 text-[13px] font-semibold text-white"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={working}
            className="flex-1 rounded-lg bg-dorado py-2.5 text-[13px] font-semibold text-oliva-dd disabled:opacity-60"
          >
            {working ? "Aplicando..." : "Listo"}
          </button>
        </div>
      </div>
    </div>
  );
}
