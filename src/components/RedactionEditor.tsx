"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { colors } from "@/lib/tokens";

/**
 * 本人確認書類のモザイク編集（0078 UI）。
 *
 * 選んだ画像を Canvas に描き、指／マウスでなぞった部分だけを「モザイク（画素化）」
 * で隠せる。住所・マイナンバー等の不要な個人情報を、アップロード前に本人の手で
 * マスクできる。確定すると、モザイク済みの画像を新しい File にして親へ返す。
 *
 * 実装:
 *   base   … 元画像（キャップ済み解像度）
 *   mosaic … 画像をブロック化したモザイク版（imageSmoothing=false で拡大）
 *   mask   … ユーザーがなぞった軌跡（不透明で塗る）
 *   view   … 表示用。毎回 base を描き、mask で切り抜いた mosaic を上に重ねる。
 * 出力は view（＝base＋なぞった所だけモザイク）を JPEG 化。
 */

const MAX_DIM = 1400; // アップロード用に長辺をこのサイズへ縮小
const BRUSH_SIZES = [
  { key: "s", label: "細", px: 22 },
  { key: "m", label: "中", px: 40 },
  { key: "l", label: "太", px: 68 },
] as const;

export function RedactionEditor({
  file,
  onCancel,
  onConfirm,
}: {
  file: File;
  onCancel: () => void;
  onConfirm: (edited: File) => void;
}) {
  const viewRef = useRef<HTMLCanvasElement>(null);
  const baseRef = useRef<HTMLCanvasElement | null>(null);
  const mosaicRef = useRef<HTMLCanvasElement | null>(null);
  const maskRef = useRef<HTMLCanvasElement | null>(null);
  const tmpRef = useRef<HTMLCanvasElement | null>(null);
  const historyRef = useRef<ImageData[]>([]);
  const drawingRef = useRef(false);
  const lastRef = useRef<{ x: number; y: number } | null>(null);

  const [ready, setReady] = useState(false);
  const [brush, setBrush] = useState<(typeof BRUSH_SIZES)[number]["px"]>(40);
  const [dirty, setDirty] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const render = useCallback(() => {
    const view = viewRef.current;
    const base = baseRef.current;
    const mosaic = mosaicRef.current;
    const mask = maskRef.current;
    const tmp = tmpRef.current;
    if (!view || !base || !mosaic || !mask || !tmp) return;
    const vctx = view.getContext("2d");
    const tctx = tmp.getContext("2d");
    if (!vctx || !tctx) return;
    // mosaic を mask で切り抜き（destination-in）
    tctx.clearRect(0, 0, tmp.width, tmp.height);
    tctx.globalCompositeOperation = "source-over";
    tctx.drawImage(mosaic, 0, 0);
    tctx.globalCompositeOperation = "destination-in";
    tctx.drawImage(mask, 0, 0);
    tctx.globalCompositeOperation = "source-over";
    // view = base + 切り抜いたモザイク
    vctx.clearRect(0, 0, view.width, view.height);
    vctx.drawImage(base, 0, 0);
    vctx.drawImage(tmp, 0, 0);
  }, []);

  // 画像を読み込んで各レイヤーを用意する。
  useEffect(() => {
    let revoked = false;
    let url: string | null = null;
    (async () => {
      try {
        let bmp: ImageBitmap | HTMLImageElement;
        let w: number;
        let h: number;
        if (typeof createImageBitmap === "function") {
          bmp = await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions);
          w = bmp.width;
          h = bmp.height;
        } else {
          url = URL.createObjectURL(file);
          const img = await new Promise<HTMLImageElement>((res, rej) => {
            const i = new Image();
            i.onload = () => res(i);
            i.onerror = rej;
            i.src = url!;
          });
          bmp = img;
          w = img.naturalWidth;
          h = img.naturalHeight;
        }
        if (revoked) return;
        const scale = Math.min(1, MAX_DIM / Math.max(w, h));
        const cw = Math.max(1, Math.round(w * scale));
        const ch = Math.max(1, Math.round(h * scale));

        const mk = (): HTMLCanvasElement => {
          const c = document.createElement("canvas");
          c.width = cw;
          c.height = ch;
          return c;
        };
        const base = mk();
        base.getContext("2d")!.drawImage(bmp as CanvasImageSource, 0, 0, cw, ch);

        // モザイク版: 小さく描いてから拡大（補間なし）でブロック化。
        const mosaic = mk();
        const block = Math.max(6, Math.round(Math.max(cw, ch) / 42));
        const sw = Math.max(1, Math.round(cw / block));
        const sh = Math.max(1, Math.round(ch / block));
        const small = document.createElement("canvas");
        small.width = sw;
        small.height = sh;
        small.getContext("2d")!.drawImage(base, 0, 0, sw, sh);
        const mctx = mosaic.getContext("2d")!;
        mctx.imageSmoothingEnabled = false;
        mctx.drawImage(small, 0, 0, sw, sh, 0, 0, cw, ch);

        const mask = mk();
        const tmp = mk();
        const view = viewRef.current!;
        view.width = cw;
        view.height = ch;

        baseRef.current = base;
        mosaicRef.current = mosaic;
        maskRef.current = mask;
        tmpRef.current = tmp;
        historyRef.current = [];
        render();
        setReady(true);
      } catch {
        setLoadError(true);
      }
    })();
    return () => {
      revoked = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [file, render]);

  const canvasPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const view = viewRef.current!;
    const rect = view.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * view.width,
      y: ((e.clientY - rect.top) / rect.height) * view.height,
    };
  };

  const paintDot = (x: number, y: number) => {
    const mask = maskRef.current;
    if (!mask) return;
    const mctx = mask.getContext("2d")!;
    mctx.fillStyle = "#000";
    mctx.beginPath();
    mctx.arc(x, y, brush, 0, Math.PI * 2);
    mctx.fill();
  };

  const paintLine = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const dist = Math.hypot(b.x - a.x, b.y - a.y);
    const steps = Math.max(1, Math.ceil(dist / (brush / 2)));
    for (let i = 0; i <= steps; i++) {
      paintDot(a.x + ((b.x - a.x) * i) / steps, a.y + ((b.y - a.y) * i) / steps);
    }
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!ready) return;
    e.preventDefault();
    const mask = maskRef.current;
    if (mask) {
      // Undo 用に直前の mask を退避（最大20手）。
      const snap = mask.getContext("2d")!.getImageData(0, 0, mask.width, mask.height);
      historyRef.current.push(snap);
      if (historyRef.current.length > 20) historyRef.current.shift();
    }
    drawingRef.current = true;
    const p = canvasPoint(e);
    lastRef.current = p;
    paintDot(p.x, p.y);
    render();
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
  };

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    e.preventDefault();
    const p = canvasPoint(e);
    if (lastRef.current) paintLine(lastRef.current, p);
    lastRef.current = p;
    render();
  };

  const onUp = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    lastRef.current = null;
    setDirty(true);
  };

  const undo = () => {
    const mask = maskRef.current;
    const prev = historyRef.current.pop();
    if (!mask || !prev) return;
    mask.getContext("2d")!.putImageData(prev, 0, 0);
    render();
    setDirty(historyRef.current.length > 0);
  };

  const reset = () => {
    const mask = maskRef.current;
    if (!mask) return;
    mask.getContext("2d")!.clearRect(0, 0, mask.width, mask.height);
    historyRef.current = [];
    render();
    setDirty(false);
  };

  const confirm = () => {
    const view = viewRef.current;
    if (!view) return;
    view.toBlob(
      (blob) => {
        if (!blob) return;
        const name = (file.name || "id").replace(/\.[^.]+$/, "") + "_masked.jpg";
        onConfirm(new File([blob], name, { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.9,
    );
  };

  return (
    <div style={{ padding: "12px 0 0" }}>
      <p style={{ margin: "0 0 10px", fontSize: 12.5, color: colors.textSecondary, lineHeight: 1.8 }}>
        住所・マイナンバー等、<b>隠したい部分を指でなぞって</b>ください。なぞった所だけモザイクがかかります。
        <span style={{ display: "block", fontSize: 11, color: colors.textMutedSoft, marginTop: 3 }}>
          ※ 顔・氏名・生年月日は確認に必要なので隠さないでください。
        </span>
      </p>

      {loadError ? (
        <div style={{ padding: "24px", textAlign: "center", fontSize: 12.5, color: "#C0453F" }}>
          画像を読み込めませんでした。別の画像でお試しください。
        </div>
      ) : (
        <div
          style={{
            position: "relative",
            borderRadius: 14,
            overflow: "hidden",
            border: `1px solid ${colors.border}`,
            background: "#000",
            lineHeight: 0,
          }}
        >
          <canvas
            ref={viewRef}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            style={{ width: "100%", height: "auto", touchAction: "none", cursor: "crosshair", display: "block" }}
          />
          {!ready && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12.5 }}>
              読み込み中…
            </div>
          )}
        </div>
      )}

      {/* ブラシ・操作 */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, color: colors.textMutedAlt }}>太さ</span>
        {BRUSH_SIZES.map((b) => {
          const on = brush === b.px;
          return (
            <button
              key={b.key}
              onClick={() => setBrush(b.px)}
              style={{
                border: on ? `2px solid ${colors.primary}` : `1px solid ${colors.border}`,
                background: on ? colors.primaryBg5 : colors.white,
                color: on ? colors.primary : colors.textSecondary,
                fontFamily: "inherit",
                fontSize: 12,
                fontWeight: 700,
                padding: on ? "6px 13px" : "7px 14px",
                borderRadius: 999,
                cursor: "pointer",
              }}
            >
              {b.label}
            </button>
          );
        })}
        <button
          onClick={undo}
          disabled={historyRef.current.length === 0}
          style={{ marginLeft: "auto", border: `1px solid ${colors.border}`, background: colors.white, color: colors.textSecondary, fontFamily: "inherit", fontSize: 12, fontWeight: 700, padding: "7px 14px", borderRadius: 10, cursor: historyRef.current.length ? "pointer" : "default", opacity: historyRef.current.length ? 1 : 0.4 }}
        >
          ひとつ戻す
        </button>
        <button
          onClick={reset}
          disabled={!dirty}
          style={{ border: `1px solid ${colors.border}`, background: colors.white, color: colors.textSecondary, fontFamily: "inherit", fontSize: 12, fontWeight: 700, padding: "7px 14px", borderRadius: 10, cursor: dirty ? "pointer" : "default", opacity: dirty ? 1 : 0.4 }}
        >
          全て消す
        </button>
      </div>

      <div style={{ display: "flex", gap: 9, marginTop: 16 }}>
        <button
          onClick={onCancel}
          style={{ flex: 1, border: `1px solid ${colors.border}`, background: colors.white, color: colors.textSecondary, fontFamily: "inherit", fontSize: 13, fontWeight: 700, padding: "12px 0", borderRadius: 12, cursor: "pointer" }}
        >
          画像を選び直す
        </button>
        <button
          onClick={confirm}
          disabled={!ready}
          style={{ flex: 2, border: "none", background: colors.primary, color: colors.white, fontFamily: "inherit", fontSize: 13, fontWeight: 700, padding: "12px 0", borderRadius: 12, cursor: ready ? "pointer" : "default", opacity: ready ? 1 : 0.5 }}
        >
          この内容で使う
        </button>
      </div>
    </div>
  );
}
