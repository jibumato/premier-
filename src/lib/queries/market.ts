"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export interface MarketListItem {
  key: string;
  title: string;
  work: string;
  price: string;
  size: string;
  condition: string;
  sold: boolean;
  imageUrl: string | null;
}

export interface MarketItemDetail {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerVerified: boolean;
  title: string;
  work: string;
  price: string;
  size: string;
  condition: string;
  shipping: string | null;
  body: string | null;
  imageUrl: string | null;
  sold: boolean;
}

const yen = (n: number) => `¥${n.toLocaleString()}`;

/** Blocked sellers + auto-hidden listings to keep out of the grid (Phase 5). */
export interface MarketFilter {
  blockedUserIds: string[];
  hiddenMarketIds: string[];
}

/** Marketplace listing grid, newest first. Blocked sellers' items and
 * auto-hidden listings are filtered out when a viewer's filter is supplied. */
export function useMarketItems(filter?: MarketFilter) {
  return useQuery({
    queryKey: ["market_items", filter?.blockedUserIds ?? [], filter?.hiddenMarketIds ?? []],
    enabled: isSupabaseConfigured(),
    queryFn: async (): Promise<MarketListItem[]> => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("market_items")
        .select("id, seller_id, title, price, size, item_condition, status, image_url, works(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      let rows = (data ?? []) as unknown as {
        id: string;
        seller_id: string;
        title: string;
        price: number;
        size: string;
        item_condition: string;
        status: string;
        image_url: string | null;
        works: { name: string } | null;
      }[];
      if (filter) {
        const blocked = new Set(filter.blockedUserIds);
        const hidden = new Set(filter.hiddenMarketIds);
        rows = rows.filter((r) => !blocked.has(r.seller_id) && !hidden.has(r.id));
      }
      return rows.map((r) => ({
        key: r.id,
        title: r.title,
        work: r.works?.name ?? "その他",
        price: yen(r.price),
        size: r.size,
        condition: r.item_condition,
        sold: r.status === "sold",
        imageUrl: r.image_url,
      }));
    },
  });
}

/** Single listing (detail screen), with seller info. */
export function useMarketItem(itemId: string | null) {
  return useQuery({
    queryKey: ["market_item", itemId],
    enabled: isSupabaseConfigured() && Boolean(itemId),
    queryFn: async (): Promise<MarketItemDetail | null> => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("market_items")
        .select(
          "id, seller_id, title, price, size, item_condition, shipping, body, image_url, status, works(name), profiles(display_name, is_verified)",
        )
        .eq("id", itemId!)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const row = data as unknown as {
        id: string;
        seller_id: string;
        title: string;
        price: number;
        size: string;
        item_condition: string;
        shipping: string | null;
        body: string | null;
        image_url: string | null;
        status: string;
        works: { name: string } | null;
        profiles: { display_name: string; is_verified: boolean } | null;
      };
      return {
        id: row.id,
        sellerId: row.seller_id,
        sellerName: row.profiles?.display_name ?? "不明",
        sellerVerified: row.profiles?.is_verified ?? false,
        title: row.title,
        work: row.works?.name ?? "その他",
        price: yen(row.price),
        size: row.size,
        condition: row.item_condition,
        shipping: row.shipping,
        body: row.body,
        imageUrl: row.image_url,
        sold: row.status === "sold",
      };
    },
  });
}

export function useCreateMarketItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      sellerId: string;
      title: string;
      workId: string | null;
      price: number;
      size: string;
      condition: string;
      shipping: string;
      body: string;
      imageUrl: string | null;
    }): Promise<string> => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("market_items")
        .insert({
          seller_id: input.sellerId,
          title: input.title,
          work_id: input.workId,
          price: input.price,
          size: input.size,
          item_condition: input.condition,
          shipping: input.shipping || null,
          body: input.body || null,
          image_url: input.imageUrl,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["market_items"] }),
  });
}

/** Flip a listing to SOLD (seller only, enforced by RLS). */
export function useMarkSold() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId }: { itemId: string }) => {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.from("market_items").update({ status: "sold" }).eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: (_d, { itemId }) => {
      qc.invalidateQueries({ queryKey: ["market_item", itemId] });
      qc.invalidateQueries({ queryKey: ["market_items"] });
    },
  });
}
