"use client";

import { useQuery } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { StudioItem } from "@/lib/data";

/** 撮影スタジオ一覧（運営キュレーション）。名前順。 */
export function useStudios() {
  return useQuery({
    queryKey: ["studios"],
    enabled: isSupabaseConfigured(),
    queryFn: async (): Promise<StudioItem[]> => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("studios")
        .select("id, name, region, area_text, tags, price_text, url, description")
        .order("name");
      if (error) throw error;
      type Row = {
        id: string;
        name: string;
        region: string;
        area_text: string;
        tags: string[];
        price_text: string | null;
        url: string | null;
        description: string | null;
      };
      return ((data ?? []) as unknown as Row[]).map((r) => ({
        key: r.id,
        name: r.name,
        region: r.region,
        area: r.area_text,
        tags: r.tags ?? [],
        price: r.price_text ?? "",
        url: r.url,
        description: r.description ?? "",
      }));
    },
  });
}
