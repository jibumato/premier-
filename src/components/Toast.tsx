"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { colors } from "@/lib/tokens";

interface ToastItem {
  id: number;
  message: string;
  variant: "error" | "info";
}

interface ToastApi {
  /** 画面下部に短時間トーストを出す。alert() の代わりに使う（フォームの
   * バリデーション等、その場に出したいエラーは従来どおりインラインでよい）。 */
  showToast: (message: string, variant?: "error" | "info") => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

/** alert() の置き換え。ブラウザ標準のalertはモバイルで無骨な上、次の操作を
 * ブロックしてしまう。画面下部に自動で消えるトーストを出す方式に統一する。 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const showToast = useCallback((message: string, variant: "error" | "info" = "error") => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, message, variant }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 3400);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        style={{
          position: "fixed",
          left: "50%",
          bottom: 88,
          transform: "translateX(-50%)",
          zIndex: 300,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          alignItems: "center",
          width: "min(340px, calc(100vw - 32px))",
          pointerEvents: "none",
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            style={{
              width: "100%",
              background: t.variant === "error" ? "#4A2320" : colors.textPrimary,
              color: colors.white,
              fontSize: 12.5,
              fontWeight: 600,
              lineHeight: 1.6,
              padding: "11px 16px",
              borderRadius: 13,
              boxShadow: "0 12px 26px -12px rgba(0,0,0,.5)",
              textAlign: "center",
              whiteSpace: "pre-line",
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
