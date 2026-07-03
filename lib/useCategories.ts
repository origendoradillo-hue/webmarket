"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES as DEFAULT_CATEGORIES, ZONES as DEFAULT_ZONES } from "@/lib/data";
import { Category } from "@/lib/types";

export function useCategories() {
  const [categories, setCategories] = useState<Record<string, Category>>(DEFAULT_CATEGORIES);
  const [zones, setZones] = useState<string[]>(DEFAULT_ZONES);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("categories").select("id, label, icon").order("orden"),
      supabase.from("subcategories").select("category_id, label").order("orden"),
      supabase.from("zones").select("label").order("orden"),
    ]).then(([catRes, subRes, zoneRes]) => {
      if (!catRes.data || catRes.data.length === 0) return;
      const next: Record<string, Category> = {};
      for (const c of catRes.data) next[c.id] = { label: c.label, icon: c.icon, subs: [] };
      for (const s of subRes.data || []) next[s.category_id]?.subs.push(s.label);
      setCategories(next);
      if (zoneRes.data && zoneRes.data.length > 0) setZones(zoneRes.data.map((z) => z.label));
    });
  }, []);

  return { categories, zones };
}
