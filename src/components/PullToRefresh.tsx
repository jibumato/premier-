"use client";

import { useRef, useState, type ReactNode } from "react";
import { colors } from "@/lib/tokens";
import { RefreshIcon } from "./icons";

const PULL_THRESHOLD = 64; // これ以上引っぱって離すと更新される
const MAX_PULL = 90;

/**
 * 一覧の先頭を指で下に引っぱって更新する（プルリフレッシュ）。
 * 実際のスクロールは共有の `.pt-scroll` コンテナが担っているため、このラッパー
 * 自体はスクロールしない。タッチ開始時に `.pt-scroll` が最上部
 * （scrollTop===0）のときだけジェスチャーを有効にすることで、一覧の途中を
 * 下にスワイプしたときに誤発火しないようにする。
 */
export function PullToRefresh({
  onRefresh,
  refreshing = false,
  children,
}: {
  onRefresh: () => void;
  refreshing?: boolean;
  children: ReactNode;
}) {
  const [pull, setPull] = useState(0);
  const draggingRef = useRef(false);
  const startYRef = useRef(0);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const scrollEl = wrapperRef.current?.closest(".pt-scroll") as HTMLElement | null;
    if (!scrollEl || scrollEl.scrollTop > 0 || refreshing) return;
    draggingRef.current = true;
    startYRef.current = e.touches[0].clientY;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!draggingRef.current) return;
    const delta = e.touches[0].clientY - startYRef.current;
    if (delta <= 0) {
      setPull(0);
      return;
    }
    // 引っぱるほど抵抗が強くなり、際限なく伸びないようにする
    setPull(Math.min(MAX_PULL, delta * 0.5));
  };
  const endDrag = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    if (pull >= PULL_THRESHOLD) onRefresh();
    setPull(0);
  };

  const indicatorHeight = refreshing ? 46 : pull;

  return (
    <div ref={wrapperRef} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={endDrag} onTouchCancel={endDrag}>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: indicatorHeight,
          overflow: "hidden",
          transition: draggingRef.current ? "none" : "height 0.2s ease",
        }}
      >
        <span
          className={refreshing ? "pt-spin" : undefined}
          style={{
            display: "flex",
            width: 28,
            height: 28,
            borderRadius: "50%",
            alignItems: "center",
            justifyContent: "center",
            background: colors.primaryBg4,
            transform: refreshing ? undefined : `rotate(${Math.min(180, (pull / PULL_THRESHOLD) * 180)}deg)`,
          }}
        >
          <RefreshIcon size={14} color={colors.primary} />
        </span>
      </div>
      {children}
    </div>
  );
}
