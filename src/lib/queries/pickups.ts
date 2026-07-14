"use client";

import { useQuery } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export interface HomePickup {
  key: string;
  imageUrl: string;
  caption: string | null;
}

/**
 * トップの「プルミエ！ピックアップ」用の、運営がキュレーションした写真。
 * is_active なものを sort 昇順で最大8件。表示側で「8件あれば8、なければ4」を出し分ける。
 */
export function useHomePickups() {
  return useQuery({
    queryKey: ["home_pickups"],
    enabled: isSupabaseConfigured(),
    queryFn: async (): Promise<HomePickup[]> => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("home_pickups")
        .select("id, image_url, caption")
        .eq("is_active", true)
        .order("sort", { ascending: true })
        .limit(8);
      if (error) throw error;
      return ((data ?? []) as { id: string; image_url: string; caption: string | null }[]).map((r) => ({
        key: r.id,
        imageUrl: r.image_url,
        caption: r.caption,
      }));
    },
  });
}
