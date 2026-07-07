"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function RegistrarVista({ listingId }: { listingId: string }) {
  useEffect(() => {
    async function registrar() {
      const supabase = createClient();
      await supabase.rpc("registrar_vista", { p_listing_id: listingId });
    }
    registrar();
  }, [listingId]);

  return null;
}
