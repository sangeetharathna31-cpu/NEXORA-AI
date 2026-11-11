// Thin client for the NEXORA Python backend. All requests are same-origin (/api/*):
// Vite proxies them in dev, Flask serves them in production. No keys live in the browser.

export type Conversation = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count?: number;
  preview?: string;
};

export type Message = {
  id: number | string;
  role: "user" | "assistant";
  content: string;
  topic: string | null;
  created_at: string;
  failed?: boolean;
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

let csrfToken = "";
let sessionPromise: Promise<SessionInfo> | null = null;

export type SessionInfo = { csrf_token: string; display_name: string; max_message_chars: number };

export function loadSession(force = false): Promise<SessionInfo> {
  if (!sessionPromise || force) {
    sessionPromise = fetch("/api/session", { credentials: "same-origin" })
      .then(async (r) => {
        if (!r.ok) throw new ApiError("Could not start session", r.status);
        const s = (await r.json()) as SessionInfo;
        csrfToken = s.csrf_token;
        return s;
      })
      .catch((e) => {
        sessionPromise = null; // allow retry
        throw e;
      });
  }
  return sessionPromise;
}

async function request<T>(method: string, url: string, body?: unknown, retried = false): Promise<T> {
  await loadSession();
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      credentials: "same-origin",
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(method !== "GET" ? { "X-CSRF-Token": csrfToken } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Cannot reach the NEXORA server.", 0);
  }
  if (res.status === 403 && !retried && method !== "GET") {
    await loadSession(true); // session/CSRF expired: refresh once and retry
    return request<T>(method, url, body, true);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError((data as { error?: string }).error || `Request failed (${res.status})`, res.status);
  return data as T;
}

export const api = {
  health: () => request<{ status: string }>("GET", "/api/health"),
  conversations: () => request<{ conversations: Conversation[] }>("GET", "/api/conversations"),
  conversation: (id: string) =>
    request<{ conversation: Conversation; messages: Message[] }>("GET", `/api/conversations/${id}`),
  chat: (message: string, conversationId: string | null) =>
    request<{ conversation: Conversation; user_message: Message; assistant_message: Message }>(
      "POST",
      "/api/chat",
      { message, conversation_id: conversationId },
    ),
  deleteConversation: (id: string) => request<{ deleted: string }>("DELETE", `/api/conversations/${id}`),
  deleteAll: () => request<{ deleted: number }>("DELETE", "/api/conversations"),
  search: (q: string) => request<{ results: Conversation[] }>("GET", `/api/search?q=${encodeURIComponent(q)}`),
  saveProfile: (display_name: string) => request<{ display_name: string }>("PUT", "/api/profile", { display_name }),
};
