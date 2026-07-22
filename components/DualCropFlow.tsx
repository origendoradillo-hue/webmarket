"use client";

import { useEffect, useState } from "react";
import PhotoCropModal from "./PhotoCropModal";

interface DualCropFlowProps {
  file: File;
  onConfirm: (result: { detailBlob: Blob; cardBlob: Blob }) => void;
  onCancel: () => void;
}

// La portada (tarjeta, 4:3) y el detalle (al abrir la publicación, 4:5)
// se recortan en dos pasos separados sobre el mismo archivo, en vez de
// derivar uno del otro — así se puede elegir zoom/posición distintos
// para cada uno (ej. mostrar el producto entero en el detalle pero
// acercar a un detalle puntual en la tarjeta).
export default function DualCropFlow({ file, onConfirm, onCancel }: DualCropFlowProps) {
  const [step, setStep] = useState<"detalle" | "portada">("detalle");
  const [detailBlob, setDetailBlob] = useState<Blob | null>(null);
  const [detailPreviewUrl, setDetailPreviewUrl] = useState<string | null>(null);

  useEffect(
    () => () => {
      if (detailPreviewUrl) URL.revokeObjectURL(detailPreviewUrl);
    },
    [detailPreviewUrl]
  );

  if (step === "detalle") {
    return (
      <PhotoCropModal
        file={file}
        aspect={4 / 5}
        previewPanels={[
          {
            label: "Así se ve al abrir la publicación",
            render: (url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt="" className="aspect-[4/5] w-16 rounded object-cover" />
            ),
          },
        ]}
        onConfirm={(blob) => {
          setDetailBlob(blob);
          setDetailPreviewUrl(URL.createObjectURL(blob));
          setStep("portada");
        }}
        onCancel={onCancel}
      />
    );
  }

  return (
    <PhotoCropModal
      file={file}
      aspect={4 / 3}
      previewPanels={[
        ...(detailPreviewUrl
          ? [
              {
                label: "Al abrir (ya elegido)",
                render: () => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={detailPreviewUrl} alt="" className="aspect-[4/5] w-16 rounded object-cover" />
                ),
              },
            ]
          : []),
        {
          label: "En la portada",
          render: (url: string) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="aspect-[4/3] w-20 rounded object-cover" />
          ),
        },
      ]}
      onConfirm={(cardBlob) => {
        if (detailBlob) onConfirm({ detailBlob, cardBlob });
      }}
      onCancel={onCancel}
    />
  );
}
