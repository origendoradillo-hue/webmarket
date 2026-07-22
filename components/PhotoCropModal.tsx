"use client";

import { useCallback, useEffect, useState } from "react";
import Cropper, { Area } from "react-easy-crop";
import { cropToBlob } from "@/lib/cropToBlob";

interface PhotoCropModalProps {
  file: File;
  aspect?: number;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
}

// Editor de recorte/zoom antes de subir una foto — se intercala entre
// "elegir archivo" y el resize/compresión que ya existía (lib/resizeImage.ts),
// que sigue aplicándose después sobre el blob recortado.
export default function PhotoCropModal({ file, aspect, onConfirm, onCancel }: PhotoCropModalProps) {
  const [imageSrc] = useState(() => URL.createObjectURL(file));
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [working, setWorking] = useState(false);

  useEffect(() => () => URL.revokeObjectURL(imageSrc), [imageSrc]);

  const onCropComplete = useCallback((_croppedArea: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

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
