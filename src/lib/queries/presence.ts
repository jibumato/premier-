"use client";

import { useEffect, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * いまホームを開いている人数（Supabase Realtime Presence）。DBには何も残さず、
 * 接続中のクライアント同士が互いの存在を共有するだけ。ログイン中はユーザーIDを
 * キーにして多重カウントを防ぎ、未ログインは実行のたびにランダムなキーを使う。
 * 自分自身も1人として数えるため、最小値は常に1（未接続時は null）。
 *
 * `ready` が false の間は購読しない（= 認証状態が確定するまで待つ）。全ユーザーが
 * 同じトピック名 `presence:home` を共有する設計のため、userId の確定を待たずに
 * 一度購読してしまうと、直後に userId が判明した際「同じトピックを一度離脱して
 * 即座に再購読する」ことになり、Supabase Realtime がその衝突で例外を投げて
 * アプリ全体がクラッシュする（#62 で修正した通知チャンネルの衝突と同種の不具合）。
 * そのため key は ready になった時点で一度だけ決定し、以降 userId が変わっても
 * 同じチャンネルを購読し続ける。
 */
/** 未ログイン閲覧者用の presence キー。crypto.randomUUID は iOS 15.4 未満の
 * WebKit に存在せず、直接呼ぶとトップページ表示だけでアプリ全体が落ちるため、
 * 無い環境では Math.random ベースの簡易IDにフォールバックする（presence の
 * 重複排除キーに使うだけなので暗号強度は不要）。 */
function anonPresenceKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `anon-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function usePresenceCount(userId: string | undefined, ready: boolean = true): number | null {
  const [count, setCount] = useState<number | null>(null);
  const keyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured() || !ready) return;
    if (keyRef.current === null) {
      keyRef.current = userId ?? anonPresenceKey();
    }
    const supabase = getSupabaseBrowserClient();
    const channel = supabase.channel("presence:home", { config: { presence: { key: keyRef.current } } });

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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- userId is intentionally excluded; see comment above.
  }, [ready]);

  return count;
}
