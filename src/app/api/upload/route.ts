import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Signed-URL alternative: the client PUTs the file to this Route Handler,
 * which writes it to the R2 bucket bound as `MEDIA` in wrangler.toml and
 * returns its public URL. Proxying through the Worker (rather than a true S3
 * presigned PUT) avoids needing R2 API tokens — the binding alone is enough.
 *
 * Kept deliberately minimal: no image resizing/variants yet (Phase 2 scope is
 * "an image ends up in R2 and is linked to a row"; transforms are a later
 * pass — see docs/ARCHITECTURE.md §3).
 */

/** Just the R2Bucket surface this route needs — avoids pulling in the full
 * @cloudflare/workers-types ambient globals, which can clash with DOM lib
 * types (fetch/Response/etc.) across the rest of the app. */
interface R2BucketLike {
  put(
    key: string,
    value: ArrayBuffer,
    options?: { httpMetadata?: { contentType?: string } },
  ): Promise<unknown>;
  delete(key: string): Promise<void>;
}

const MAX_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const KINDS = new Set(["awase", "avatar", "cover", "post", "market", "kyc"]);

export async function POST(request: Request) {
  // Require a valid Supabase session — this route writes to R2 directly via
  // the Worker's own binding, bypassing RLS entirely, so it must authenticate
  // the caller itself rather than trusting client-supplied identity.
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");
  const kind = String(form.get("kind") ?? "");
  // Owner path is the verified session's user id, never the client-supplied
  // value — prevents uploading into another user's object-key namespace.
  const ownerId = user.id;

  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "file が必要です" }, { status: 400 });
  }
  if (!KINDS.has(kind)) {
    return NextResponse.json({ error: "kind が不正です" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "対応していない画像形式です" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "ファイルサイズは8MB以下にしてください" }, { status: 400 });
  }

  const { env } = await getCloudflareContext({ async: true });
  const bucket = (env as unknown as { MEDIA?: R2BucketLike }).MEDIA;
  if (!bucket) {
    return NextResponse.json(
      { error: "画像アップロード基盤が未設定です（R2 バケット未接続）" },
      { status: 501 },
    );
  }

  const ext = file.type.split("/")[1] ?? "bin";
  const key = `${kind}/${ownerId}/${crypto.randomUUID()}.${ext}`;
  await bucket.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });

  // Strip any trailing slash(es) from the configured base so a value like
  // "https://pub-xxx.r2.dev/" doesn't produce a double slash ("…r2.dev//avatar/…"),
  // which R2 treats as a different key and returns 404 for.
  const publicBase = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.replace(/\/+$/, "");
  const url = publicBase ? `${publicBase}/${key}` : null;
  return NextResponse.json({ key, url });
}

/**
 * Delete an image object from R2. Object keys are `<kind>/<ownerId>/<uuid>.<ext>`,
 * so ownership is enforced by requiring the key's owner segment to equal the
 * verified session's user id — a caller can only delete their own uploads.
 * Called when a post is removed (or an avatar/cover replaced) so a "delete"
 * actually removes the underlying file, not just the DB reference.
 */
export async function DELETE(request: Request) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const key = new URL(request.url).searchParams.get("key") ?? "";
  const parts = key.split("/");
  // key must be "<kind>/<ownerId>/<file>"; only the owner may delete a known kind.
  if (parts.length < 3 || !KINDS.has(parts[0]) || parts[1] !== user.id) {
    return NextResponse.json({ error: "削除できません" }, { status: 403 });
  }

  const { env } = await getCloudflareContext({ async: true });
  const bucket = (env as unknown as { MEDIA?: R2BucketLike }).MEDIA;
  if (!bucket) {
    return NextResponse.json(
      { error: "画像アップロード基盤が未設定です（R2 バケット未接続）" },
      { status: 501 },
    );
  }

  await bucket.delete(key);
  return NextResponse.json({ ok: true });
}
