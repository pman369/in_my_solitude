import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { contextPage, contextBookId } = await request.json();

  // chat_sessions is not in the generated Supabase types, so we use `any`
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: session, error } = await db
    .from("chat_sessions")
    .insert({
      user_id:         user?.id ?? null,
      context_page:    contextPage   ?? null,
      context_book_id: contextBookId ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ sessionId: session.id });
}
