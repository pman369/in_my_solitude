import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/storage/signed-url?file=<storage-path>&download=1
 *
 * Generates a short-lived signed URL for a private Supabase Storage file.
 * - Any published, non-restricted book can be read by anyone.
 * - The `download=1` param requires an authenticated session.
 *
 * Returns: { url: string }
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const file     = searchParams.get("file");
  const download = searchParams.get("download") === "1";

  if (!file) {
    return NextResponse.json({ error: "Missing file parameter" }, { status: 400 });
  }

  const supabase = await createClient();

  // Require auth for downloads
  if (download) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required to download" }, { status: 401 });
    }
  }

  // Determine bucket — vault-files vs book-files
  // Convention: file_url stored as "bucket/path/to/file.pdf"
  const parts  = file.split("/");
  const bucket = parts[0];           // e.g. "book-files" or "vault-files"
  const path   = parts.slice(1).join("/"); // the rest of the path

  // Validate bucket name
  const allowedBuckets = ["book-files", "vault-files"];
  if (!allowedBuckets.includes(bucket)) {
    // Fallback: treat the entire file string as path within book-files
    const { data, error } = await supabase.storage
      .from("book-files")
      .createSignedUrl(file, 3600, {
        download: download ? true : undefined,
      });

    if (error || !data) {
      return NextResponse.json({ error: "Could not generate URL" }, { status: 500 });
    }
    return NextResponse.json({ url: data.signedUrl });
  }

  // Vault files require approved vault_access_request
  if (bucket === "vault-files") {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    // Look up a book whose file_url matches, then check access
    const filePath = [bucket, path].join("/");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    const { data: book } = await db
      .from("books")
      .select("id")
      .eq("file_url", filePath)
      .single() as { data: { id: string } | null };

    if (book) {
      const { data: access } = await db
        .from("vault_access_requests")
        .select("id")
        .eq("user_id", user.id)
        .eq("book_id", book.id)
        .eq("status", "approved")
        .single() as { data: { id: string } | null };

      if (!access) {
        return NextResponse.json({ error: "Access not approved for this Vault book" }, { status: 403 });
      }
    }
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 3600, {
      download: download ? true : undefined,
    });

  if (error || !data) {
    return NextResponse.json({ error: "Could not generate signed URL" }, { status: 500 });
  }

  return NextResponse.json({ url: data.signedUrl });
}

