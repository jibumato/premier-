"use client";

import { useMutation } from "@tanstack/react-query";

export interface UploadResult {
  key: string;
  url: string | null;
}

export type UploadKind = "awase" | "avatar" | "cover" | "post" | "market" | "kyc";

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

/**
 * Best-effort delete of an uploaded image's underlying R2 object, given its
 * public URL. Derives the object key by stripping the configured public base,
 * then calls `DELETE /api/upload` (which enforces owner-only deletion). Silently
 * no-ops for non-R2 URLs or when the bucket isn't wired — callers still delete
 * the DB row regardless, so a failed file cleanup never blocks the delete.
 */
export async function deleteUploadedImage(url: string | null | undefined): Promise<void> {
  if (!url) return;
  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.replace(/\/+$/, "");
  if (!base || !url.startsWith(`${base}/`)) return; // not an object we manage
  await deleteUploadedKey(url.slice(base.length + 1));
}

/** Best-effort delete of an R2 object by its key (e.g. `awase/<id>/<uuid>.jpg`).
 * Same owner-only enforcement server-side; never throws. */
export async function deleteUploadedKey(key: string | null | undefined): Promise<void> {
  if (!key) return;
  try {
    await fetch(`/api/upload?key=${encodeURIComponent(key)}`, { method: "DELETE" });
  } catch {
    // network/other failure — leave cleanup to a future sweep; don't block delete
  }
}
