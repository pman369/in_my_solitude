import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/storage/read?file=<storage-path>
 *
 * Streams the PDF bytes directly from Supabase Storage to the browser,
 * with correct Content-Type and Content-Disposition headers for inline
 * rendering. This avoids Chrome's "Content unavailable. Resource was not
 * cached" error that occurs when opening a raw Supabase signed URL in a
 * new tab (caused by Supabase's caching/CORS headers conflicting with
 * Chrome's PDF viewer).
 *
 * Vault files still require an approved vault_access_request.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const file = searchParams.get("file");

  if (!file || file.includes("..")) {
    return NextResponse.json({ error: "Invalid file parameter" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const parts  = file.split("/");
  const bucket = parts[0];
  const path   = parts.slice(1).join("/");

  const allowedBuckets = ["book-files", "vault-files"];
  const resolvedBucket = allowedBuckets.includes(bucket) ? bucket : "book-files";
  const resolvedPath   = allowedBuckets.includes(bucket) ? path : file;

  // Vault files require approved access
  if (resolvedBucket === "vault-files") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const { data: book } = await db
      .from("books")
      .select("id")
      .eq("file_url", file)
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
        return NextResponse.json({ error: "Access not approved" }, { status: 403 });
      }
    }
  }

  // Download the file from Supabase Storage server-side
  const { data, error } = await supabase.storage
    .from(resolvedBucket)
    .download(resolvedPath);

  if (error || !data) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  // Stream it back with headers that make Chrome's PDF viewer happy
  const filename = resolvedPath.split("/").pop() ?? "document.pdf";
  return new NextResponse(data, {
    status: 200,
    headers: {
      "Content-Type":        "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control":       "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
