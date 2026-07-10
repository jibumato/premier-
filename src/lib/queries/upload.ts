"use client";

import { useMutation } from "@tanstack/react-query";

export interface UploadResult {
  key: string;
  url: string | null;
}

export type UploadKind = "awase" | "avatar" | "cover" | "post" | "market";

/**
 * Uploads an image to R2 via `/api/upload` (see that route for the binding
 * details). The route derives the owner path from the caller's Supabase
 * session server-side — it requires the visitor to be signed in and ignores
 * any client-supplied identity. Works the same in local dev and on the
 * deployed Worker; when the R2 bucket isn't bound yet the route returns 501
 * and this mutation rejects, so callers should treat upload as best-effort
 * until Phase 2's Cloudflare setup (docs/SETUP.md) is complete.
 */
export function useUploadImage() {
  return useMutation({
    mutationFn: async ({ file, kind }: { file: File; kind: UploadKind }): Promise<UploadResult> => {
      const form = new FormData();
      form.append("file", file);
      form.append("kind", kind);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(body.error ?? "アップロードに失敗しました");
      }
      return res.json();
    },
  });
}
