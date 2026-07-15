"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * いまホームを開いている人数（Supabase Realtime Presence）。DBには何も残さず、
 * 接続中のクライアント同士が互いの存在を共有するだけ。ログイン中はユーザーIDを
 * キーにして多重カウントを防ぎ、未ログインは実行のたびにランダムなキーを使う。
 * 自分自身も1人として数えるため、最小値は常に1（未接続時は null）。
 */
export function usePresenceCount(userId: string | undefined): number | null {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = getSupabaseBrowserClient();
    const key = userId ?? crypto.randomUUID();
    const channel = supabase.channel("presence:home", { config: { presence: { key } } });

    channel.on("presence", { event: "sync" }, () => {
      setCount(Object.keys(channel.presenceState()).length);
    });

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        channel.track({ online_at: new Date().toISOString() });
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return count;
}
