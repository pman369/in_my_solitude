import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { LIBRARIAN_SYSTEM_PROMPT } from "@/lib/chat/system-prompt";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const MODEL          = "gemini-2.5-flash";
const RATE_LIMIT         = 20;
const RATE_WINDOW_MS     = 60 * 60 * 1000; // 1 hour

type RateRow = {
  identifier:    string;
  message_count: number;
  window_start:  string;
  last_message:  string;
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Identifier for rate limiting: user ID or IP
    const identifier =
      user?.id ??
      request.headers.get("x-forwarded-for") ??
      request.headers.get("x-real-ip") ??
      "anonymous";

    // ── Rate limit check ─────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rateLimitTable = (supabase as any).from("chat_rate_limits");

    const { data: rateData } = await rateLimitTable
      .select("*")
      .eq("identifier", identifier)
      .single() as { data: RateRow | null };

    const now = new Date();

    if (rateData) {
      const windowStart   = new Date(rateData.window_start);
      const windowExpired = now.getTime() - windowStart.getTime() > RATE_WINDOW_MS;

      if (windowExpired) {
        await rateLimitTable
          .update({ message_count: 1, window_start: now.toISOString(), last_message: now.toISOString() })
          .eq("identifier", identifier);
      } else if (rateData.message_count >= RATE_LIMIT) {
        return NextResponse.json(
          { error: "You have reached the hourly message limit. Please return in a little while.", code: "RATE_LIMITED" },
          { status: 429 }
        );
      } else {
        await rateLimitTable
          .update({ message_count: rateData.message_count + 1, last_message: now.toISOString() })
          .eq("identifier", identifier);
      }
    } else {
      await rateLimitTable
        .insert({ identifier, message_count: 1 });
    }

    // ── Parse request body ───────────────────────────────────
    const {
      messages,
      sessionId,
      contextPage,
      contextBookTitle,
      contextBookAuthor,
    } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "No messages provided" }, { status: 400 });
    }

    const recentMessages = messages.slice(-20);

    // ── Build context-aware system prompt ────────────────────
    let contextualPrompt = LIBRARIAN_SYSTEM_PROMPT;

    if (contextBookTitle) {
      contextualPrompt += `

═══════════════════════════════════════════════════
CURRENT READING CONTEXT
═══════════════════════════════════════════════════
The reader is currently viewing the book:
Title: "${contextBookTitle}"${contextBookAuthor ? `\nAuthor: ${contextBookAuthor}` : ""}

Tailor your responses to be relevant to this book and its themes where appropriate.
`;
    }

    if (contextPage === "/vault") {
      contextualPrompt += `

The reader is currently browsing The Vault — the restricted section of the library.
Acknowledge the gravity and sensitivity of this space in your responses.
`;
    }

    if (contextPage === "/desk") {
      contextualPrompt += `

The reader is currently at the Request Desk.
Help them clearly articulate what book or knowledge they are seeking,
and guide them through the request or donation process if needed.
`;
    }

    // ── Call Gemini API (streaming) ──────────────────────
    const geminiRes = await fetch(GEMINI_API_URL, {
      method:  "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GEMINI_API_KEY}`,
        "Content-Type":  "application/json",
        "Accept":        "text/event-stream",
      },
      body: JSON.stringify({
        model:    MODEL,
        messages: [
          { role: "system", content: contextualPrompt },
          ...recentMessages.map((m: { role: string; content: string }) => ({ role: m.role, content: m.content })),
        ],
        max_tokens:            1024,
        temperature:           0.7,
        top_p:                 0.9,
        stream:                true,
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini API error:", {
        status: geminiRes.status,
        statusText: geminiRes.statusText,
        error: errText
      });
      
      // If unauthorized, it's likely a key issue
      if (geminiRes.status === 401) {
        return NextResponse.json(
          { error: "The Librarian's credentials are invalid. Please check the API configuration." },
          { status: 502 }
        );
      }

      return NextResponse.json(
        { error: "The Librarian is momentarily unavailable. Please try again shortly." },
        { status: 502 }
      );
    }

    // ── Persist user message (fire-and-forget) ───────────────
    const lastUser = recentMessages[recentMessages.length - 1];
    if (lastUser?.role === "user" && sessionId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from("chat_messages").insert({
        session_id: sessionId,
        role:       "user",
        content:    lastUser.content,
      }).then(() => {});
    }

    // ── Stream Gemini response directly to browser ───────
    return new NextResponse(geminiRes.body, {
      headers: {
        "Content-Type":  "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection":    "keep-alive",
      },
    });

  } catch (error) {
    console.error("Chat route error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}

