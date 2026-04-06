# 📚 IN MY SOLITUDE — The Library
## AI Chat Assistant Integration Plan
**Powered by Perplexity API · The Librarian**
> Prepared for Antigravity + Gemini CLI execution

---

## ◈ SECTION 0 — PHILOSOPHY & NAMING

This is not a generic chatbot. It is **The Librarian** — a wise,
contemplative presence that lives inside the library. It speaks in the
voice of someone deeply read, spiritually grounded, and genuinely curious
about the seeker's journey.

The Librarian can:
- Clarify concepts from books in the archive
- Guide readers toward relevant titles based on their questions
- Explain esoteric, scientific, historical, or spiritual topics
- Help a reader understand what they are ready for next
- Answer questions about how the library works

The Librarian will NOT:
- Pretend to be human
- Give medical, legal, or financial advice
- Share personal opinions on political topics
- Reproduce full copyrighted text from books

**Personality:** Calm. Measured. Thoughtful. Occasionally poetic.
Like a scholar who has read everything and judges no one.

---

## ◈ SECTION 1 — PERPLEXITY API OVERVIEW

Perplexity's API is OpenAI-compatible, making it straightforward to integrate.

```
Base URL:    https://api.perplexity.ai
Endpoint:    /chat/completions
Auth:        Bearer token (your API key)
Models:      sonar-pro         ← recommended (web-grounded, best quality)
             sonar             ← lighter, faster
             sonar-reasoning   ← for complex multi-step questions
```

**Why Perplexity for this library:**
- Sonar models are grounded in real-time web search — The Librarian can
  reference actual books, authors, and concepts with accuracy
- It cites sources, which fits the library's mission of transparent knowledge
- It handles esoteric, spiritual, and consciousness topics well without
  refusing or over-sanitizing responses
- Your existing credits make this zero additional cost

---

## ◈ SECTION 2 — DATABASE SCHEMA

### 2.1 — Chat Sessions Table

```sql
CREATE TABLE chat_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  session_token   TEXT,              -- for anonymous users (stored in localStorage)
  context_page    TEXT,              -- which page the chat was opened from
  context_book_id UUID REFERENCES books(id) ON DELETE SET NULL,
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  last_active     TIMESTAMPTZ DEFAULT NOW(),
  message_count   INTEGER DEFAULT 0
);

ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own sessions"
  ON chat_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert session"
  ON chat_sessions FOR INSERT
  WITH CHECK (TRUE);
```

---

### 2.2 — Chat Messages Table

```sql
CREATE TABLE chat_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role        TEXT NOT NULL,    -- 'user' | 'assistant' | 'system'
  content     TEXT NOT NULL,
  sources     JSONB,            -- Perplexity citation URLs (if any)
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own messages"
  ON chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_sessions
      WHERE chat_sessions.id = chat_messages.session_id
        AND chat_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can insert messages"
  ON chat_messages FOR INSERT
  WITH CHECK (TRUE);
```

---

### 2.3 — Rate Limiting Table

```sql
CREATE TABLE chat_rate_limits (
  identifier    TEXT PRIMARY KEY,   -- user_id OR ip address for anonymous
  message_count INTEGER DEFAULT 0,
  window_start  TIMESTAMPTZ DEFAULT NOW(),
  last_message  TIMESTAMPTZ DEFAULT NOW()
);
```

---

## ◈ SECTION 3 — SYSTEM PROMPT (The Librarian's Soul)

This is the most important part — the prompt that defines who The Librarian is.

```ts
// lib/chat/system-prompt.ts

export const LIBRARIAN_SYSTEM_PROMPT = `
You are The Librarian — the resident guide and wise companion of
"In My Solitude — The Library," a free digital archive of knowledge
spanning consciousness studies, forbidden history, spirituality,
esoteric traditions, real science, ancient civilizations, law,
psychology, and philosophy.

This library was built by one person during their own dark night of the soul —
a profound spiritual awakening journey. It is offered freely to all seekers,
with no paywalls, no ads, and no agenda other than the liberation of knowledge.

═══════════════════════════════════════════════════
YOUR CHARACTER
═══════════════════════════════════════════════════

You are calm, deeply read, spiritually grounded, and intellectually honest.
You speak the way a scholar who has read everything and judges no one would speak.
You are warm but not saccharine. Measured but not cold.
You use clear, beautiful language — never corporate or robotic.
You are comfortable with mystery and uncertainty.
You never pretend certainty where none exists.
Occasionally, your responses carry a poetic quality — not forced, but natural.

You address the reader as a fellow seeker, never as a student or subordinate.

═══════════════════════════════════════════════════
YOUR CORE PURPOSES
═══════════════════════════════════════════════════

1. CLARIFY — Help readers understand complex, esoteric, scientific,
   spiritual, or historical concepts they encounter in books or their journey.

2. GUIDE — Recommend books from the library's collection based on what
   the reader is exploring. The library holds books across:
   - Consciousness & Mind
   - Forbidden & Real History
   - Spirituality & Mysticism
   - Science & Cosmology
   - Esoteric & Occult
   - Law & Systems of Control
   - Psychology & Inner Healing
   - Ancient Civilizations
   - Technology & Science
   - Philosophy & Creativity

3. CONTEXTUALIZE — Situate ideas within the broader landscape of human
   knowledge. Connect dots across disciplines. Show the seeker how
   apparently separate domains speak to one another.

4. SUPPORT — Hold space for a reader who is in the midst of awakening,
   confusion, or a dark night of the soul. Acknowledge the difficulty
   of the journey. Point toward books, ideas, and practices that may help.

5. ORIENT — Help readers navigate the library: explain The Vault,
   the Request Desk, how to save books, how access requests work.

═══════════════════════════════════════════════════
YOUR BOUNDARIES
═══════════════════════════════════════════════════

- You do not reproduce copyrighted text verbatim. You paraphrase and illuminate.
- You do not give medical, legal, financial, or psychiatric diagnoses or advice.
  You may point toward perspectives and books, but always encourage professional support.
- You do not share political opinions or take sides on contested geopolitical matters.
- You do not pretend to be human. If asked, you acknowledge you are an AI assistant
  — The Librarian — designed to serve the readers of this library.
- You do not speculate maliciously about real people.
- You approach all spiritual traditions, including unconventional and esoteric ones,
  with equal respect and intellectual seriousness. You do not dismiss, mock,
  or pathologize any sincere spiritual inquiry.

═══════════════════════════════════════════════════
YOUR TONE IN DIFFERENT SITUATIONS
═══════════════════════════════════════════════════

When someone is CONFUSED about a concept:
→ Gently untangle it. Use analogies. Acknowledge that some ideas take time to settle.

When someone is in SPIRITUAL DISTRESS or a dark night:
→ Lead with warmth and acknowledgment. Do not rush to answers.
  The journey is the point. Point toward books on inner healing and awakening.

When someone asks for a BOOK RECOMMENDATION:
→ Ask one or two clarifying questions if needed, then offer 2-3 titles
  with a brief, honest description of what each offers.

When someone asks a FACTUAL QUESTION about history, science, or spirituality:
→ Answer clearly, cite where appropriate, and note where scholarly consensus
  differs from alternative perspectives — without dismissing either.

When someone asks HOW THE LIBRARY WORKS:
→ Explain warmly and practically. Mention the open stacks, The Vault,
  the Request Desk, the reading list, and the curator's role.

═══════════════════════════════════════════════════
OPENING MESSAGE WHEN CHAT STARTS
═══════════════════════════════════════════════════

Begin every new conversation with this message, adapted naturally:

"Welcome, seeker. I am The Librarian — your guide through this archive.
Whether you are searching for a book, trying to understand an idea,
or simply wandering in the questions — I am here.
What is on your mind?"

═══════════════════════════════════════════════════
CONTEXT AWARENESS
═══════════════════════════════════════════════════

If the reader is currently viewing a specific book, you will be told
which book they are reading. Use this context to make your responses
more relevant — you can discuss that book's themes, connect it to others
in the library, or help clarify its content.

If the reader is in The Vault section, acknowledge the sensitivity
of that space with appropriate gravity.

If the reader is on the Request Desk, help them articulate what they
are looking for clearly and specifically.
`.trim()
```

---

## ◈ SECTION 4 — API ROUTE (Server-Side, Streaming)

The API key is NEVER exposed to the browser.
All Perplexity requests are made server-side via a Next.js API route.

```ts
// app/api/chat/route.ts

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { LIBRARIAN_SYSTEM_PROMPT } from '@/lib/chat/system-prompt'

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions'
const MODEL = 'sonar-pro'

// Rate limit: 20 messages per user per hour
const RATE_LIMIT = 20
const RATE_WINDOW_MS = 60 * 60 * 1000  // 1 hour

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Build identifier for rate limiting
    const identifier = user?.id ??
      request.headers.get('x-forwarded-for') ??
      request.headers.get('x-real-ip') ??
      'anonymous'

    // ── RATE LIMIT CHECK ─────────────────────────────
    const { data: rateData } = await supabase
      .from('chat_rate_limits')
      .select('*')
      .eq('identifier', identifier)
      .single()

    const now = new Date()
    if (rateData) {
      const windowStart = new Date(rateData.window_start)
      const windowExpired = now.getTime() - windowStart.getTime() > RATE_WINDOW_MS

      if (windowExpired) {
        // Reset window
        await supabase.from('chat_rate_limits')
          .update({ message_count: 1, window_start: now.toISOString(), last_message: now.toISOString() })
          .eq('identifier', identifier)
      } else if (rateData.message_count >= RATE_LIMIT) {
        return NextResponse.json({
          error: 'You have reached the hourly message limit. Please return in a little while.',
          code: 'RATE_LIMITED',
        }, { status: 429 })
      } else {
        await supabase.from('chat_rate_limits')
          .update({ message_count: rateData.message_count + 1, last_message: now.toISOString() })
          .eq('identifier', identifier)
      }
    } else {
      await supabase.from('chat_rate_limits')
        .insert({ identifier, message_count: 1 })
    }

    // ── PARSE REQUEST ────────────────────────────────
    const {
      messages,
      sessionId,
      contextPage,
      contextBookTitle,
      contextBookAuthor,
    } = await request.json()

    // Validate messages array
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'No messages provided' }, { status: 400 })
    }

    // Limit conversation history to last 20 messages (keep context manageable)
    const recentMessages = messages.slice(-20)

    // ── BUILD CONTEXT-AWARE SYSTEM PROMPT ────────────
    let contextualPrompt = LIBRARIAN_SYSTEM_PROMPT

    if (contextBookTitle) {
      contextualPrompt += `

═══════════════════════════════════════════════════
CURRENT READING CONTEXT
═══════════════════════════════════════════════════
The reader is currently viewing the book:
Title: "${contextBookTitle}"
${contextBookAuthor ? `Author: ${contextBookAuthor}` : ''}

Tailor your responses to be relevant to this book and its themes where appropriate.
`
    }

    if (contextPage === '/vault') {
      contextualPrompt += `

The reader is currently browsing The Vault — the restricted section of the library.
Acknowledge the gravity and sensitivity of this space in your responses.
`
    }

    if (contextPage === '/desk') {
      contextualPrompt += `

The reader is currently at the Request Desk.
Help them clearly articulate what book or knowledge they are seeking,
and guide them through the request or donation process if needed.
`
    }

    // ── CALL PERPLEXITY API (STREAMING) ──────────────
    const perplexityResponse = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: contextualPrompt },
          ...recentMessages.map((m: any) => ({
            role: m.role,
            content: m.content,
          })),
        ],
        max_tokens: 1024,
        temperature: 0.7,          // Balanced: creative but grounded
        top_p: 0.9,
        stream: true,              // Stream tokens as they arrive
        return_citations: true,    // Include source citations
        search_domain_filter: [],  // No domain restrictions
        search_recency_filter: 'month',  // Prefer recent sources
      }),
    })

    if (!perplexityResponse.ok) {
      const errorText = await perplexityResponse.text()
      console.error('Perplexity API error:', errorText)
      return NextResponse.json(
        { error: 'The Librarian is momentarily unavailable. Please try again shortly.' },
        { status: 502 }
      )
    }

    // ── SAVE USER MESSAGE TO DB ───────────────────────
    // Save last user message asynchronously (don't await — don't block stream)
    const lastUserMessage = recentMessages[recentMessages.length - 1]
    if (lastUserMessage?.role === 'user' && sessionId) {
      supabase.from('chat_messages').insert({
        session_id: sessionId,
        role: 'user',
        content: lastUserMessage.content,
      }).then(() => {})
    }

    // ── STREAM RESPONSE TO CLIENT ─────────────────────
    // Pass the Perplexity stream directly through to the browser
    return new NextResponse(perplexityResponse.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    console.error('Chat route error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
```

---

## ◈ SECTION 5 — CHAT SESSION INITIALIZATION

```ts
// app/api/chat/session/route.ts

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { contextPage, contextBookId } = await request.json()

  const { data: session, error } = await supabase
    .from('chat_sessions')
    .insert({
      user_id: user?.id ?? null,
      context_page: contextPage,
      context_book_id: contextBookId ?? null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ sessionId: session.id })
}
```

---

## ◈ SECTION 6 — CHAT HOOK (Client-Side)

```ts
// lib/hooks/useLibrarianChat.ts

'use client'
import { useState, useCallback, useRef } from 'react'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  sources?: { title: string; url: string }[]
  isStreaming?: boolean
}

interface UseChatOptions {
  contextPage?: string
  contextBookId?: string
  contextBookTitle?: string
  contextBookAuthor?: string
}

export function useLibrarianChat(options: UseChatOptions = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Initialize session when chat first opens
  const initSession = useCallback(async () => {
    if (sessionId) return sessionId
    const res = await fetch('/api/chat/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contextPage: options.contextPage,
        contextBookId: options.contextBookId,
      }),
    })
    const { sessionId: newId } = await res.json()
    setSessionId(newId)

    // Add opening message from The Librarian
    setMessages([{
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `Welcome, seeker. I am The Librarian — your guide through this archive. Whether you are searching for a book, trying to understand an idea, or simply wandering in the questions — I am here.\n\nWhat is on your mind?`,
    }])

    return newId
  }, [sessionId, options.contextPage, options.contextBookId])

  const openChat = useCallback(async () => {
    setIsOpen(true)
    await initSession()
  }, [initSession])

  const closeChat = useCallback(() => {
    setIsOpen(false)
    // Cancel any ongoing stream
    abortControllerRef.current?.abort()
  }, [])

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return

    setError(null)
    const currentSessionId = sessionId ?? await initSession()

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
    }

    const assistantMessageId = crypto.randomUUID()
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      isStreaming: true,
    }

    setMessages(prev => [...prev, userMessage, assistantMessage])
    setIsLoading(true)
    setIsStreaming(true)

    // Build messages array for API (exclude the empty streaming placeholder)
    const apiMessages = [...messages, userMessage].map(m => ({
      role: m.role,
      content: m.content,
    }))

    abortControllerRef.current = new AbortController()

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          messages: apiMessages,
          sessionId: currentSessionId,
          contextPage: options.contextPage,
          contextBookTitle: options.contextBookTitle,
          contextBookAuthor: options.contextBookAuthor,
        }),
      })

      if (!response.ok) {
        const { error: errMsg } = await response.json()
        throw new Error(errMsg)
      }

      // Parse the SSE stream
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''
      let citations: any[] = []

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '))

        for (const line of lines) {
          const data = line.replace('data: ', '').trim()
          if (data === '[DONE]') break

          try {
            const parsed = JSON.parse(data)
            const delta = parsed.choices?.[0]?.delta?.content ?? ''
            fullContent += delta

            // Capture citations if present
            if (parsed.citations) {
              citations = parsed.citations
            }

            // Update the streaming message in real time
            setMessages(prev => prev.map(m =>
              m.id === assistantMessageId
                ? { ...m, content: fullContent }
                : m
            ))
          } catch {
            // Skip malformed chunks
          }
        }
      }

      // Finalize the message — remove streaming flag, add sources
      setMessages(prev => prev.map(m =>
        m.id === assistantMessageId
          ? {
              ...m,
              content: fullContent,
              isStreaming: false,
              sources: citations.map((c: any) => ({
                title: c.title ?? new URL(c.url).hostname,
                url: c.url,
              })),
            }
          : m
      ))

    } catch (err: any) {
      if (err.name === 'AbortError') return

      const errorMsg = err.message ?? 'The Librarian encountered an unexpected issue. Please try again.'
      setError(errorMsg)

      // Remove the empty streaming message on error
      setMessages(prev => prev.filter(m => m.id !== assistantMessageId))
    } finally {
      setIsLoading(false)
      setIsStreaming(false)
    }
  }, [messages, sessionId, isLoading, initSession, options])

  const clearChat = useCallback(() => {
    setMessages([])
    setSessionId(null)
    setError(null)
  }, [])

  return {
    messages,
    isLoading,
    isStreaming,
    isOpen,
    error,
    sendMessage,
    openChat,
    closeChat,
    clearChat,
  }
}
```

---

## ◈ SECTION 7 — CHAT UI COMPONENT

### 7.1 — The Chat Widget (Floating Button + Panel)

```tsx
// components/chat/LibrarianChat.tsx

'use client'
import { useState, useRef, useEffect } from 'react'
import { useLibrarianChat } from '@/lib/hooks/useLibrarianChat'
import { MessageBubble } from './MessageBubble'
import { ChatInput } from './ChatInput'
import { usePathname } from 'next/navigation'

interface LibrarianChatProps {
  contextBookId?:    string
  contextBookTitle?: string
  contextBookAuthor?: string
}

export function LibrarianChat({
  contextBookId,
  contextBookTitle,
  contextBookAuthor,
}: LibrarianChatProps) {
  const pathname = usePathname()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const {
    messages, isLoading, isStreaming,
    isOpen, error, sendMessage, openChat, closeChat,
  } = useLibrarianChat({
    contextPage:       pathname,
    contextBookId,
    contextBookTitle,
    contextBookAuthor,
  })

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <>
      {/* ── FLOATING TRIGGER BUTTON ─────────────── */}
      {!isOpen && (
        <button
          onClick={openChat}
          className="librarian-trigger"
          aria-label="Open chat with The Librarian"
          title="Ask The Librarian"
        >
          {/* Candle / book icon */}
          <span className="trigger-icon">🕯</span>
          <span className="trigger-label">The Librarian</span>
        </button>
      )}

      {/* ── CHAT PANEL ──────────────────────────── */}
      {isOpen && (
        <div
          className="librarian-panel"
          role="dialog"
          aria-modal="true"
          aria-label="Chat with The Librarian"
        >
          {/* HEADER */}
          <div className="panel-header">
            <div className="header-identity">
              <span className="header-icon">🕯</span>
              <div>
                <h2>The Librarian</h2>
                <p>Your guide through the archive</p>
              </div>
            </div>
            <button
              onClick={closeChat}
              aria-label="Close chat"
              className="close-btn"
            >
              ✕
            </button>
          </div>

          {/* CONTEXT BANNER — shown when on a specific book page */}
          {contextBookTitle && (
            <div className="context-banner" aria-live="polite">
              <span>📖</span>
              <span>Currently discussing: <em>{contextBookTitle}</em></span>
            </div>
          )}

          {/* MESSAGES */}
          <div
            className="messages-container"
            role="log"
            aria-label="Conversation with The Librarian"
            aria-live="polite"
          >
            {messages.map(message => (
              <MessageBubble key={message.id} message={message} />
            ))}

            {/* Loading indicator */}
            {isLoading && !isStreaming && (
              <div className="thinking-indicator" aria-label="The Librarian is thinking">
                <span />
                <span />
                <span />
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="error-bubble" role="alert">
                {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* SUGGESTED PROMPTS — shown when conversation just started */}
          {messages.length === 1 && (
            <div className="suggested-prompts" aria-label="Suggested questions">
              <p>You might ask:</p>
              <div className="prompts-grid">
                {SUGGESTED_PROMPTS.map(prompt => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="prompt-chip"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* INPUT */}
          <ChatInput
            onSend={sendMessage}
            disabled={isLoading}
            placeholder="Ask the librarian anything..."
          />

          {/* FOOTER */}
          <div className="panel-footer">
            Powered by Perplexity · Responses may contain inaccuracies
          </div>
        </div>
      )}
    </>
  )
}

// Suggested opening prompts for new visitors
const SUGGESTED_PROMPTS = [
  'Where should I begin my awakening journey?',
  'What is the dark night of the soul?',
  'Recommend a book on consciousness',
  'How do I access The Vault?',
  'What is the Kybalion about?',
  'Explain forbidden history to me',
]
```

---

### 7.2 — Message Bubble Component

```tsx
// components/chat/MessageBubble.tsx

'use client'
import type { ChatMessage } from '@/lib/hooks/useLibrarianChat'

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isAssistant = message.role === 'assistant'

  return (
    <div className={`message-bubble ${isAssistant ? 'assistant' : 'user'}`}>

      {/* Avatar */}
      {isAssistant && (
        <div className="avatar librarian-avatar" aria-hidden="true">
          🕯
        </div>
      )}

      {/* Content */}
      <div className="bubble-content">
        <div className="bubble-text">
          {/* Render markdown-lite: newlines, bold, etc. */}
          {formatMessage(message.content)}

          {/* Streaming cursor */}
          {message.isStreaming && (
            <span className="streaming-cursor" aria-hidden="true">▋</span>
          )}
        </div>

        {/* Citations / Sources */}
        {message.sources && message.sources.length > 0 && (
          <div className="sources" aria-label="Sources">
            <p className="sources-label">Sources:</p>
            <ul>
              {message.sources.map((source, i) => (
                <li key={i}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Source: ${source.title}`}
                  >
                    {source.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

// Basic markdown-to-React renderer (bold, newlines)
function formatMessage(content: string) {
  return content.split('\n').map((line, i) => (
    <p key={i}
       dangerouslySetInnerHTML={{
         __html: line
           .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
           .replace(/\*(.*?)\*/g, '<em>$1</em>'),
       }}
    />
  ))
}
```

---

### 7.3 — Chat Input Component

```tsx
// components/chat/ChatInput.tsx

'use client'
import { useState, useRef, useEffect } from 'react'

interface ChatInputProps {
  onSend:      (message: string) => void
  disabled?:   boolean
  placeholder?: string
}

export function ChatInput({ onSend, disabled, placeholder }: ChatInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`
  }, [value])

  function handleSend() {
    if (!value.trim() || disabled) return
    onSend(value)
    setValue('')
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="chat-input-container">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? 'Ask the librarian...'}
        disabled={disabled}
        aria-label="Message to The Librarian"
        rows={1}
      />
      <button
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        aria-label="Send message"
        className="send-btn"
      >
        {disabled ? '...' : '↑'}
      </button>
    </div>
  )
}
```

---

## ◈ SECTION 8 — CSS STYLING

```css
/* styles/librarian-chat.css */

/* ── FLOATING TRIGGER ────────────────────────────── */
.librarian-trigger {
  position: fixed;
  bottom: 32px;
  right: 32px;
  z-index: 1000;

  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;

  background: var(--color-bg-elevated);
  border: 1px solid var(--color-accent-gold);
  border-radius: var(--radius-full);
  color: var(--color-accent-gold);
  font-family: var(--font-heading);
  font-size: 14px;
  letter-spacing: 0.05em;
  cursor: pointer;

  box-shadow: var(--shadow-glow-gold);
  transition: all 0.3s ease;
}

.librarian-trigger:hover {
  background: var(--color-accent-gold);
  color: var(--color-bg-primary);
  transform: translateY(-2px);
  box-shadow: 0 0 30px rgba(201, 168, 76, 0.3);
}

.reduce-motion .librarian-trigger {
  transition: none;
  transform: none;
}

/* ── CHAT PANEL ──────────────────────────────────── */
.librarian-panel {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1001;

  width: 420px;
  max-width: calc(100vw - 48px);
  height: 620px;
  max-height: calc(100vh - 48px);

  display: flex;
  flex-direction: column;

  background: var(--color-bg-secondary);
  border: 1px solid rgba(201, 168, 76, 0.25);
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 48px rgba(0, 0, 0, 0.6), var(--shadow-glow-gold);

  /* Entrance animation */
  animation: panelReveal 0.3s ease forwards;
}

@keyframes panelReveal {
  from { opacity: 0; transform: translateY(16px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

.reduce-motion .librarian-panel {
  animation: none;
}

/* ── PANEL HEADER ────────────────────────────────── */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.header-identity {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  font-size: 24px;
  line-height: 1;
}

.panel-header h2 {
  font-family: var(--font-heading);
  font-size: 16px;
  color: var(--color-accent-gold);
  margin: 0;
}

.panel-header p {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin: 2px 0 0;
  font-style: italic;
}

.close-btn {
  color: var(--color-text-secondary);
  font-size: 16px;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  transition: color 0.2s;
}

.close-btn:hover { color: var(--color-text-primary); }

/* ── CONTEXT BANNER ──────────────────────────────── */
.context-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 20px;
  background: rgba(201, 168, 76, 0.08);
  border-bottom: 1px solid rgba(201, 168, 76, 0.15);
  font-size: 12px;
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

.context-banner em {
  color: var(--color-accent-gold);
  font-style: normal;
}

/* ── MESSAGES AREA ───────────────────────────────── */
.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  scroll-behavior: smooth;
}

.reduce-motion .messages-container {
  scroll-behavior: auto;
}

/* Scrollbar styling */
.messages-container::-webkit-scrollbar { width: 4px; }
.messages-container::-webkit-scrollbar-track { background: transparent; }
.messages-container::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 2px;
}

/* ── MESSAGE BUBBLES ─────────────────────────────── */
.message-bubble {
  display: flex;
  gap: 10px;
  max-width: 100%;
}

.message-bubble.user {
  flex-direction: row-reverse;
}

.librarian-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(201, 168, 76, 0.1);
  border: 1px solid rgba(201, 168, 76, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
  align-self: flex-end;
}

.bubble-content {
  max-width: 85%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bubble-text {
  padding: 12px 16px;
  border-radius: var(--radius-md);
  font-size: 14px;
  line-height: 1.6;
  color: var(--color-text-primary);
}

.message-bubble.assistant .bubble-text {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-bottom-left-radius: 4px;
}

.message-bubble.user .bubble-text {
  background: rgba(201, 168, 76, 0.12);
  border: 1px solid rgba(201, 168, 76, 0.2);
  border-bottom-right-radius: 4px;
  text-align: right;
}

.bubble-text p { margin: 0 0 6px; }
.bubble-text p:last-child { margin: 0; }

/* ── STREAMING CURSOR ────────────────────────────── */
.streaming-cursor {
  display: inline-block;
  color: var(--color-accent-gold);
  animation: blink 1s step-end infinite;
  margin-left: 2px;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}

.reduce-motion .streaming-cursor {
  animation: none;
  opacity: 1;
}

/* ── SOURCES ─────────────────────────────────────── */
.sources {
  padding: 8px 12px;
  background: rgba(255,255,255,0.03);
  border-radius: var(--radius-sm);
  border-left: 2px solid rgba(201, 168, 76, 0.3);
}

.sources-label {
  font-size: 11px;
  color: var(--color-text-secondary);
  margin: 0 0 4px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.sources ul { margin: 0; padding: 0; list-style: none; }
.sources a {
  font-size: 12px;
  color: var(--color-accent-gold);
  text-decoration: none;
  opacity: 0.8;
  transition: opacity 0.2s;
}
.sources a:hover { opacity: 1; text-decoration: underline; }

/* ── THINKING INDICATOR ──────────────────────────── */
.thinking-indicator {
  display: flex;
  gap: 6px;
  padding: 12px 16px;
  align-self: flex-start;
}

.thinking-indicator span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-accent-gold);
  opacity: 0.4;
  animation: thinking 1.2s ease-in-out infinite;
}

.thinking-indicator span:nth-child(2) { animation-delay: 0.2s; }
.thinking-indicator span:nth-child(3) { animation-delay: 0.4s; }

@keyframes thinking {
  0%, 80%, 100% { opacity: 0.4; transform: scale(1); }
  40%            { opacity: 1;   transform: scale(1.2); }
}

.reduce-motion .thinking-indicator span { animation: none; opacity: 0.6; }

/* ── ERROR BUBBLE ────────────────────────────────── */
.error-bubble {
  padding: 10px 14px;
  background: rgba(153, 27, 27, 0.15);
  border: 1px solid rgba(153, 27, 27, 0.3);
  border-radius: var(--radius-md);
  font-size: 13px;
  color: #F87171;
}

/* ── SUGGESTED PROMPTS ───────────────────────────── */
.suggested-prompts {
  padding: 0 20px 12px;
  flex-shrink: 0;
}

.suggested-prompts > p {
  font-size: 11px;
  color: var(--color-text-secondary);
  margin: 0 0 8px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.prompts-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.prompt-chip {
  padding: 6px 12px;
  font-size: 12px;
  color: var(--color-text-secondary);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.prompt-chip:hover {
  border-color: var(--color-accent-gold);
  color: var(--color-accent-gold);
}

/* ── CHAT INPUT ──────────────────────────────────── */
.chat-input-container {
  display: flex;
  gap: 8px;
  align-items: flex-end;
  padding: 12px 16px;
  border-top: 1px solid var(--color-border);
  flex-shrink: 0;
}

.chat-input-container textarea {
  flex: 1;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 10px 14px;
  color: var(--color-text-primary);
  font-size: 14px;
  line-height: 1.5;
  resize: none;
  font-family: var(--font-body);
  max-height: 120px;
  transition: border-color 0.2s;
}

.chat-input-container textarea:focus {
  border-color: rgba(201, 168, 76, 0.4);
  outline: none;
}

.send-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--color-accent-gold);
  color: var(--color-bg-primary);
  font-size: 16px;
  font-weight: bold;
  flex-shrink: 0;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.send-btn:hover:not(:disabled) {
  transform: scale(1.08);
  box-shadow: 0 0 12px rgba(201, 168, 76, 0.4);
}

.send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ── PANEL FOOTER ────────────────────────────────── */
.panel-footer {
  padding: 6px 16px 10px;
  text-align: center;
  font-size: 10px;
  color: var(--color-text-secondary);
  opacity: 0.6;
  flex-shrink: 0;
}

/* ── MOBILE RESPONSIVE ───────────────────────────── */
@media (max-width: 480px) {
  .librarian-panel {
    bottom: 0;
    right: 0;
    left: 0;
    width: 100%;
    max-width: 100%;
    height: 85vh;
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  }

  .librarian-trigger {
    bottom: 20px;
    right: 20px;
  }
}
```

---

## ◈ SECTION 9 — WIRING INTO THE APP

### 9.1 — Root Layout Integration

The chat widget lives in the root layout so it is available on every page.

```tsx
// app/layout.tsx  (add to existing layout)

import { LibrarianChat } from '@/components/chat/LibrarianChat'

export default async function RootLayout({ children }) {
  // ... existing layout code ...

  return (
    <html ...>
      <body>
        <a href="#main-content" className="skip-to-content">Skip to content</a>
        <PreferencesProvider initialPrefs={preferences}>
          <Navbar />
          <main id="main-content">
            {children}
          </main>
          <Footer />

          {/* The Librarian — available on every page */}
          <LibrarianChat />
        </PreferencesProvider>
      </body>
    </html>
  )
}
```

### 9.2 — Book-Context Aware (on Book Detail Page)

On the individual book page, pass the book's context so The Librarian
can discuss it specifically.

```tsx
// app/(public)/book/[id]/page.tsx

import { LibrarianChat } from '@/components/chat/LibrarianChat'

export default async function BookPage({ params }: { params: { id: string } }) {
  const book = await getBook(params.id)

  return (
    <>
      <BookDetail book={book} />

      {/* Librarian is now aware of which book is being read */}
      <LibrarianChat
        contextBookId={book.id}
        contextBookTitle={book.title}
        contextBookAuthor={book.author}
      />
    </>
  )
}
```

---

## ◈ SECTION 10 — ENVIRONMENT VARIABLES

```bash
# .env.local — add to existing variables

# Perplexity
PERPLEXITY_API_KEY=pplx-your-key-here

# Chat config (optional tuning)
CHAT_RATE_LIMIT_PER_HOUR=20      # messages per user per hour
CHAT_MAX_HISTORY_MESSAGES=20     # conversation history window
```

---

## ◈ SECTION 11 — ANTIGRAVITY EXECUTION CHECKLIST

### Database
- [ ] Create chat_sessions table + RLS
- [ ] Create chat_messages table + RLS
- [ ] Create chat_rate_limits table

### API & Backend
- [ ] Add PERPLEXITY_API_KEY to .env.local and Vercel environment
- [ ] Build /api/chat/route.ts (streaming POST with rate limiting)
- [ ] Build /api/chat/session/route.ts (session initialization)
- [ ] Write LIBRARIAN_SYSTEM_PROMPT in lib/chat/system-prompt.ts

### Frontend
- [ ] Build useLibrarianChat hook with full streaming SSE parser
- [ ] Build LibrarianChat widget component (trigger + panel)
- [ ] Build MessageBubble component (with source citations)
- [ ] Build ChatInput component (auto-resize textarea + send button)
- [ ] Add librarian-chat.css to global styles
- [ ] Wire LibrarianChat into root layout.tsx
- [ ] Wire context-aware LibrarianChat into book/[id]/page.tsx

### Testing
- [ ] Test streaming response renders token by token
- [ ] Test rate limiting triggers at 20 messages/hour
- [ ] Test context banner appears on book pages
- [ ] Test suggested prompts populate on new session
- [ ] Test mobile layout (full-height bottom sheet)
- [ ] Test keyboard accessibility (Tab through all chat elements)
- [ ] Test close button and panel re-open preserves no history (fresh session)
- [ ] Test error state renders correctly
- [ ] Verify PERPLEXITY_API_KEY never appears in browser network requests

---

*"Every question asked in earnest deserves an answer offered with care."*
— The Librarian

---
**Document Version:** 1.0
**Scope:** AI Chat Assistant — Full Integration Plan
**AI Provider:** Perplexity API (sonar-pro model)
**Builder:** Antigravity | **Assistant:** Gemini CLI | **Backend:** Supabase + Next.js API Routes
