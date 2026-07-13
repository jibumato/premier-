"use client";

import { useMutation } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * 退会（アカウント削除）。SECURITY DEFINER 関数 `delete_my_account()` が
 * auth.uid() 本人の auth.users 行を削除し、profiles 以下が cascade で消える。
 * 削除後はサーバー側でセッションが無効になるため、ローカルの signOut も行い、
 * AuthGate がログイン画面に戻す。
 */
export function useDeleteAccount() {
  return useMutation({
    mutationFn: async () => {
      if (!isSupabaseConfigured()) return;
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.rpc("delete_my_account");
      if (error) throw error;
      // アカウントが消えたのでローカルセッションも破棄（失敗しても致命的ではない）
      await supabase.auth.signOut().catch(() => {});
    },
  });
}
