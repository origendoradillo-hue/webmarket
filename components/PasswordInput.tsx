"use client";

import { useState } from "react";

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  wrapperClassName?: string;
}

export default function PasswordInput({ value, onChange, placeholder, required, wrapperClassName }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={`relative ${wrapperClassName ?? ""}`}>
      <input
        type={visible ? "text" : "password"}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-piedra/70 px-3 py-2.5 pr-10 text-[13.5px] text-tinta"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-tinta-suave"
      >
        <i className={`ti ${visible ? "ti-eye-off" : "ti-eye"} text-base`} aria-hidden />
      </button>
    </div>
  );
}
