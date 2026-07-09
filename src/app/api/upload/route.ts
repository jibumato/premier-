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
}

const MAX_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const KINDS = new Set(["awase", "avatar", "cover", "post"]);

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

  const publicBase = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
  const url = publicBase ? `${publicBase}/${key}` : null;
  return NextResponse.json({ key, url });
}
