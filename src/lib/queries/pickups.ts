"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { deleteUploadedImage } from "@/lib/queries/upload";

export interface HomePickup {
  key: string;
  imageUrl: string;
  caption: string | null;
}

/** 管理画面用の行（非公開も含む・並び順や公開状態も持つ）。 */
export interface AdminHomePickup {
  id: string;
  imageUrl: string;
  caption: string | null;
  sort: number;
  isActive: boolean;
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

// =============================================================================
// 運営（is_admin）向け: ピックアップの管理（追加・編集・削除・並び替え）。
// 書き込みは RLS で is_admin() に限定（0037）。
// =============================================================================

/** 管理画面用: 非公開も含めた全ピックアップを並び順で取得。 */
export function useAdminHomePickups(enabled: boolean) {
  return useQuery({
    queryKey: ["admin_home_pickups"],
    enabled: isSupabaseConfigured() && enabled,
    queryFn: async (): Promise<AdminHomePickup[]> => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("home_pickups")
        .select("id, image_url, caption, sort, is_active")
        .order("sort", { ascending: true });
      if (error) throw error;
      return ((data ?? []) as {
        id: string;
        image_url: string;
        caption: string | null;
        sort: number;
        is_active: boolean;
      }[]).map((r) => ({
        id: r.id,
        imageUrl: r.image_url,
        caption: r.caption,
        sort: r.sort,
        isActive: r.is_active,
      }));
    },
  });
}

function invalidatePickups(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["admin_home_pickups"] });
  qc.invalidateQueries({ queryKey: ["home_pickups"] });
}

/** 新規ピックアップを追加（sort は末尾に付与）。 */
export function useCreateHomePickup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ imageUrl, caption, sort }: { imageUrl: string; caption: string | null; sort: number }) => {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase
        .from("home_pickups")
        .insert({ image_url: imageUrl, caption, sort });
      if (error) throw error;
    },
    onSuccess: () => invalidatePickups(qc),
  });
}

/** ピックアップの更新（公開切替・キャプション・並び順）。 */
export function useUpdateHomePickup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: { caption?: string | null; sort?: number; is_active?: boolean };
    }) => {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.from("home_pickups").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidatePickups(qc),
  });
}

/** ピックアップを削除（R2 の画像本体もベストエフォートで削除）。 */
export function useDeleteHomePickup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, imageUrl }: { id: string; imageUrl: string }) => {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.from("home_pickups").delete().eq("id", id);
      if (error) throw error;
      // 行を消せたら画像本体も片付ける（失敗しても行削除は成立しているので無視）。
      await deleteUploadedImage(imageUrl);
    },
    onSuccess: () => invalidatePickups(qc),
  });
}
