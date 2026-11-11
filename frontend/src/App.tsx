import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { ApiError, api, loadSession, type Conversation, type Message } from "./api";

type IconName =
  | "spark"
  | "plus"
  | "search"
  | "more"
  | "settings"
  | "panel"
  | "moon"
  | "sun"
  | "paperclip"
  | "arrowUp"
  | "copy"
  | "refresh"
  | "thumbUp"
  | "thumbDown"
  | "code"
  | "book"
  | "chart"
  | "bulb"
  | "history"
  | "user"
  | "shield"
  | "sliders"
  | "chevron"
  | "menu"
  | "close"
  | "check"
  | "trash"
  | "logout"
  | "alert"
  | "command";

function Icon({
  name,
  size = 18,
  strokeWidth = 1.8,
}: {
  name: IconName;
  size?: number;
  strokeWidth?: number;
}) {
  const paths: Record<IconName, ReactNode> = {
    spark: (
      <>
        <path d="M12 2.5c.7 3.9 2.9 6.1 6.8 6.8-3.9.7-6.1 2.9-6.8 6.8-.7-3.9-2.9-6.1-6.8-6.8C9.1 8.6 11.3 6.4 12 2.5Z" />
        <path d="M19 15.5c.3 1.8 1.3 2.8 3 3-1.7.3-2.7 1.3-3 3-.3-1.7-1.3-2.7-3-3 1.7-.2 2.7-1.2 3-3Z" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14M5 12h14" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16 16 4.2 4.2" />
      </>
    ),
    more: (
      <>
        <circle cx="5" cy="12" r=".8" fill="currentColor" stroke="none" />
        <circle cx="12" cy="12" r=".8" fill="currentColor" stroke="none" />
        <circle cx="19" cy="12" r=".8" fill="currentColor" stroke="none" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
      </>
    ),
    panel: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2.5" />
        <path d="M9 4v16M5.8 9h.1" />
      </>
    ),
    moon: <path d="M20 15.2A8.2 8.2 0 0 1 8.8 4a8.3 8.3 0 1 0 11.2 11.2Z" />,
    sun: (
      <>
        <circle cx="12" cy="12" r="3.6" />
        <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4" />
      </>
    ),
    paperclip: (
      <path d="m20 11.5-7.8 7.8a5 5 0 0 1-7.1-7.1l8.5-8.5a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-2.8-2.8l7.8-7.8" />
    ),
    arrowUp: (
      <>
        <path d="m6 10 6-6 6 6M12 4v16" />
      </>
    ),
    copy: (
      <>
        <rect x="8" y="8" width="11" height="11" rx="2" />
        <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
      </>
    ),
    refresh: (
      <>
        <path d="M20 7v5h-5M4 17v-5h5" />
        <path d="M6.1 8a7 7 0 0 1 11.4-2.2L20 8M4 16l2.5 2.2A7 7 0 0 0 17.9 16" />
      </>
    ),
    thumbUp: (
      <path d="M7 10v10H3V10h4Zm0 8 3 2h6.5a2 2 0 0 0 2-1.6l1.2-6A2 2 0 0 0 17.8 10H14l.7-3.4A2.2 2.2 0 0 0 12.6 4L7 10v8Z" />
    ),
    thumbDown: (
      <path d="M7 14V4H3v10h4Zm0-8 3-2h6.5a2 2 0 0 1 2 1.6l1.2 6a2 2 0 0 1-1.9 2.4H14l.7 3.4a2.2 2.2 0 0 1-2.1 2.6L7 14V6Z" />
    ),
    code: (
      <>
        <path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 5l-4 14" />
      </>
    ),
    book: (
      <>
        <path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H11v17H7.5A3.5 3.5 0 0 0 4 22V5.5ZM20 5.5A3.5 3.5 0 0 0 16.5 2H13v17h3.5a3.5 3.5 0 0 1 3.5 3V5.5Z" />
      </>
    ),
    chart: (
      <>
        <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
      </>
    ),
    bulb: (
      <>
        <path d="M9 18h6M10 22h4M8.2 14.8A7 7 0 1 1 15.8 15c-.8.6-.8 1.3-.8 2H9c0-.8 0-1.5-.8-2.2Z" />
      </>
    ),
    history: (
      <>
        <path d="M4 12a8 8 0 1 0 2.3-5.7L4 8.6" />
        <path d="M4 4v4.6h4.6M12 7.5V12l3 2" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
      </>
    ),
    shield: <path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10Z" />,
    sliders: (
      <>
        <path d="M4 6h8M16 6h4M4 18h4M12 18h8M4 12h2M10 12h10" />
        <circle cx="14" cy="6" r="2" />
        <circle cx="8" cy="12" r="2" />
        <circle cx="10" cy="18" r="2" />
      </>
    ),
    chevron: <path d="m9 18 6-6-6-6" />,
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    check: <path d="m5 12 4 4L19 6" />,
    trash: (
      <>
        <path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6" />
      </>
    ),
    logout: (
      <>
        <path d="M10 5H5v14h5M14 8l4 4-4 4M8 12h10" />
      </>
    ),
    alert: (
      <>
        <path d="M12 3 2.8 20h18.4L12 3Z" />
        <path d="M12 9v5M12 17.2v.1" />
      </>
    ),
    command: (
      <>
        <path d="M9 6.5A2.5 2.5 0 1 0 6.5 9H18M15 6.5A2.5 2.5 0 1 1 17.5 9H6M9 15H6.5A2.5 2.5 0 1 0 9 17.5V6M15 15h2.5a2.5 2.5 0 1 1-2.5 2.5V6" />
      </>
    ),
  };
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

const suggestions = [
  {
    icon: "book" as IconName,
    title: "Explain a concept",
    desc: "Understand complex topics simply.",
    prompt: "What is a list?",
  },
  {
    icon: "code" as IconName,
    title: "Write Python code",
    desc: "Generate, debug and understand code.",
    prompt: "How do I define a function?",
  },
  {
    icon: "chart" as IconName,
    title: "Analyse information",
    desc: "Discover insights from your data.",
    prompt: "Difference between list and tuple",
  },
  {
    icon: "bulb" as IconName,
    title: "Brainstorm ideas",
    desc: "Turn your ideas into action.",
    prompt: "topics",
  },
];

/* ---------- helpers ---------- */

const GROUPS = ["Today", "Yesterday", "Previous 7 Days", "Older"] as const;

function groupOf(iso: string): (typeof GROUPS)[number] {
  const d = new Date(iso);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const days = Math.floor((startOfToday.getTime() - d.getTime()) / 86400000) + 1;
  if (d >= startOfToday) return "Today";
  if (days <= 1) return "Yesterday";
  if (days <= 7) return "Previous 7 Days";
  return "Older";
}

function relTime(iso: string): string {
  const d = new Date(iso);
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h`;
  if (mins < 10080) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

const clock = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("") || "G";

function Avatar({ name, small = false }: { name: string; small?: boolean }) {
  return (
    <div className={`avatar ${small ? "avatar-small" : ""}`} aria-label={name}>
      <span>{initials(name)}</span>
      <i />
    </div>
  );
}

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand">
      <div className="brand-mark">
        <span />
        <span />
      </div>
      {!compact && (
        <strong>
          NEXORA <b>AI</b>
        </strong>
      )}
    </div>
  );
}

function ThemeToggle({ theme, onToggle }: { theme: "dark" | "light"; onToggle: () => void }) {
  return (
    <button
      className="theme-toggle"
      onClick={onToggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
    >
      <span className={theme === "light" ? "active" : ""}>
        <Icon name="sun" size={14} />
      </span>
      <span className={theme === "dark" ? "active" : ""}>
        <Icon name="moon" size={14} />
      </span>
    </button>
  );
}

function Sidebar({
  collapsed,
  drawerOpen,
  current,
  activeId,
  conversations,
  displayName,
  onNavigate,
  onOpen,
  onDeleteOne,
  onCollapse,
  onClose,
}: {
  collapsed: boolean;
  drawerOpen: boolean;
  current: string;
  activeId: string | null;
  conversations: Conversation[];
  displayName: string;
  onNavigate: (screen: string) => void;
  onOpen: (id: string) => void;
  onDeleteOne: (id: string) => void;
  onCollapse: () => void;
  onClose: () => void;
}) {
  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""} ${drawerOpen ? "drawer-open" : ""}`}>
      <div className="sidebar-top">
        <Logo compact={collapsed} />
        <button className="icon-btn mobile-close" onClick={onClose} aria-label="Close menu">
          <Icon name="close" />
        </button>
      </div>
      <button className="new-chat" onClick={() => onNavigate("empty")}>
        <Icon name="plus" size={17} />
        {!collapsed && <span>New chat</span>}
      </button>
      {!collapsed && (
        <button className="search-box" onClick={() => onNavigate("search")}>
          <Icon name="search" size={16} />
          <span>Search conversations</span>
          <kbd>⌘ K</kbd>
        </button>
      )}
      <nav className="conversation-nav" aria-label="Conversations">
        {collapsed ? (
          <>
            <button className="rail-btn" onClick={() => onNavigate("search")} aria-label="Search">
              <Icon name="search" />
            </button>
            <button className="rail-btn" onClick={() => onNavigate("history")} aria-label="History">
              <Icon name="history" />
            </button>
          </>
        ) : conversations.length === 0 ? (
          <div className="conversation-group">
            <div className="group-label">No conversations yet</div>
          </div>
        ) : (
          GROUPS.map((group) => {
            const items = conversations.filter((c) => groupOf(c.updated_at) === group);
            if (!items.length) return null;
            return (
              <div className="conversation-group" key={group}>
                <div className="group-label">{group}</div>
                {items.map((item) => (
                  <button
                    key={item.id}
                    className={`conversation-item ${current === "chat" && item.id === activeId ? "selected" : ""}`}
                    onClick={() => onOpen(item.id)}
                  >
                    <span>{item.title}</span>
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label={`Delete ${item.title}`}
                      title="Delete conversation"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteOne(item.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          e.stopPropagation();
                          onDeleteOne(item.id);
                        }
                      }}
                    >
                      <Icon name="trash" size={15} />
                    </span>
                  </button>
                ))}
              </div>
            );
          })
        )}
      </nav>
      <div className="sidebar-bottom">
        {!collapsed && (
          <button className="settings-row" onClick={() => onNavigate("settings")}>
            <Icon name="settings" size={17} />
            <span>Settings</span>
            <Icon name="chevron" size={15} />
          </button>
        )}
        <button className="profile-row" onClick={() => onNavigate("profile")}>
          <Avatar name={displayName} small />
          {!collapsed && (
            <span>
              <strong>{displayName}</strong>
              <small>Guest session</small>
            </span>
          )}
          {!collapsed && <Icon name="more" size={17} />}
        </button>
        <button className="collapse-btn" onClick={onCollapse}>
          <Icon name="panel" size={17} />
          {!collapsed && <span>Collapse sidebar</span>}
        </button>
      </div>
    </aside>
  );
}

function Topbar({
  title,
  theme,
  online,
  displayName,
  onTheme,
  onNew,
  onMenu,
  onProfile,
}: {
  title: string;
  theme: "dark" | "light";
  online: boolean;
  displayName: string;
  onTheme: () => void;
  onNew: () => void;
  onMenu: () => void;
  onProfile: () => void;
}) {
  return (
    <header className="topbar">
      <button className="icon-btn mobile-menu" onClick={onMenu} aria-label="Open menu">
        <Icon name="menu" />
      </button>
      <div className="title-lockup">
        <h1>{title}</h1>
        <div className="status">
          <i />
          Nexora Intelligence <span>{online ? "Online" : "Offline"}</span>
        </div>
      </div>
      <div className="top-actions">
        <ThemeToggle theme={theme} onToggle={onTheme} />
        <button className="secondary-btn new-conversation" onClick={onNew}>
          <Icon name="plus" size={16} />
          <span>New conversation</span>
        </button>
        <button className="avatar-button" onClick={onProfile} aria-label="Profile">
          <Avatar name={displayName} small />
        </button>
      </div>
    </header>
  );
}

function SuggestionGrid({ onSelect }: { onSelect: (prompt: string) => void }) {
  return (
    <div className="suggestion-grid">
      {suggestions.map((item) => (
        <button className="suggestion-card" key={item.title} onClick={() => onSelect(item.prompt)}>
          <span className="suggestion-icon">
            <Icon name={item.icon} size={19} />
          </span>
          <span>
            <strong>{item.title}</strong>
            <small>{item.desc}</small>
          </span>
          <Icon name="arrowUp" size={15} />
        </button>
      ))}
    </div>
  );
}

function EmptyChat({ onSelect }: { onSelect: (prompt: string) => void }) {
  return (
    <div className="empty-chat">
      <div className="ambient-mark">
        <div className="brand-mark large">
          <span />
          <span />
        </div>
      </div>
      <div className="eyebrow">
        <Icon name="spark" size={14} /> Nexora Intelligence
      </div>
      <h2>
        Your ideas deserve <em>intelligence.</em>
      </h2>
      <p>Ask anything about Python. Explore everything.</p>
      <SuggestionGrid onSelect={onSelect} />
    </div>
  );
}

/* ---------- rendering of real backend answers ---------- */

const PY_TOKEN =
  /("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')|(@\w+)|\b(def|class|return|import|from|as|if|elif|else|for|while|in|try|except|finally|raise|with|yield|lambda|break|continue|and|or|not|is|None|True|False)\b|\b([A-Za-z_]\w*)(?=\()/g;

function highlight(code: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const m of code.matchAll(PY_TOKEN)) {
    const i = m.index ?? 0;
    if (i > last) out.push(code.slice(last, i));
    const cls = m[1] ? "str" : m[2] ? "dec" : m[3] ? "kw" : "fn";
    out.push(
      <span className={cls} key={key++}>
        {m[0]}
      </span>,
    );
    last = i + m[0].length;
  }
  if (last < code.length) out.push(code.slice(last));
  return out;
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };
  return (
    <div className="code-block">
      <div className="code-head">
        <span>
          <i />
          Python
        </span>
        <button onClick={copy}>
          <Icon name={copied ? "check" : "copy"} size={14} />
          {copied ? "Copied" : "Copy code"}
        </button>
      </div>
      <pre>
        <code>{highlight(code)}</code>
      </pre>
    </div>
  );
}

type Block = { kind: "p"; text: string } | { kind: "ul"; items: string[] } | { kind: "code"; text: string };

// Backend answers are plain text: 4-space-indented lines are code, "• " lines are list items.
function parseAnswer(text: string): Block[] {
  const blocks: Block[] = [];
  let code: string[] = [];
  const flushCode = () => {
    while (code.length && code[code.length - 1] === "") code.pop();
    if (code.length) blocks.push({ kind: "code", text: code.join("\n") });
    code = [];
  };
  for (const line of text.split("\n")) {
    if (line.startsWith("    ")) code.push(line.slice(4));
    else if (line.trim() === "" && code.length) code.push("");
    else {
      flushCode();
      if (line.trim() === "") continue;
      if (line.startsWith("• ")) {
        const last = blocks[blocks.length - 1];
        if (last?.kind === "ul") last.items.push(line.slice(2));
        else blocks.push({ kind: "ul", items: [line.slice(2)] });
      } else blocks.push({ kind: "p", text: line });
    }
  }
  flushCode();
  return blocks;
}

function AnswerBody({ text }: { text: string }) {
  return (
    <>
      {parseAnswer(text).map((b, i) =>
        b.kind === "code" ? (
          <CodeBlock key={i} code={b.text} />
        ) : b.kind === "ul" ? (
          <ul key={i}>
            {b.items.map((it, j) => (
              <li key={j}>{it}</li>
            ))}
          </ul>
        ) : (
          <p key={i}>{b.text}</p>
        ),
      )}
    </>
  );
}

function ResponseActions({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  return (
    <div className="response-actions">
      <button
        onClick={() => {
          navigator.clipboard?.writeText(text);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        }}
      >
        <Icon name={copied ? "check" : "copy"} size={15} />
        <span>{copied ? "Copied" : "Copy"}</span>
      </button>
      <i />
      <button
        className={vote === "up" ? "active" : ""}
        onClick={() => setVote(vote === "up" ? null : "up")}
        aria-label="Helpful"
      >
        <Icon name="thumbUp" size={15} />
      </button>
      <button
        className={vote === "down" ? "active" : ""}
        onClick={() => setVote(vote === "down" ? null : "down")}
        aria-label="Not helpful"
      >
        <Icon name="thumbDown" size={15} />
      </button>
    </div>
  );
}

function ActiveChat({
  messages,
  typing,
  displayName,
}: {
  messages: Message[];
  typing: boolean;
  displayName: string;
}) {
  const bottom = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [messages.length, typing]);
  const first = messages[0];
  return (
    <div className="message-thread">
      {first && (
        <div className="date-divider">
          <span>
            {groupOf(first.created_at) === "Today" ? "Today" : new Date(first.created_at).toLocaleDateString()},{" "}
            {clock(first.created_at)}
          </span>
        </div>
      )}
      {messages.map((m) =>
        m.role === "user" ? (
          <div className="user-message" key={m.id}>
            <div className="user-bubble">{m.content}</div>
            <Avatar name={displayName} small />
          </div>
        ) : (
          <div className="ai-message" key={m.id}>
            <div className="ai-avatar">
              <Icon name="spark" size={17} />
            </div>
            <div className="ai-content">
              <div className="message-meta">
                <strong>Nexora</strong>
                <span>{clock(m.created_at)}</span>
                {m.topic && <b>{m.topic}</b>}
              </div>
              <AnswerBody text={m.content} />
              <ResponseActions text={m.content} />
            </div>
          </div>
        ),
      )}
      {typing && (
        <div className="ai-message typing-row">
          <div className="ai-avatar">
            <Icon name="spark" size={17} />
          </div>
          <div className="typing-bubble">
            <span />
            <span />
            <span />
            <small>Nexora is thinking</small>
          </div>
        </div>
      )}
      <div ref={bottom} />
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="error-card" role="alert">
      <span className="error-icon">
        <Icon name="alert" size={22} />
      </span>
      <div>
        <strong>Something interrupted the response</strong>
        <p>{message}</p>
      </div>
      <button className="secondary-btn" onClick={onRetry}>
        <Icon name="refresh" size={15} />
        Try again
      </button>
    </div>
  );
}

function Composer({ onSend, busy, max }: { onSend: (text: string) => void; busy: boolean; max: number }) {
  const [text, setText] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    if (!text.trim() || busy) return;
    onSend(text.trim());
    setText("");
    if (ref.current) ref.current.style.height = "25px";
  };
  return (
    <div className="composer-wrap">
      <form className="composer" onSubmit={submit}>
        <button
          type="button"
          className="attach-btn"
          aria-label="Attach file (not supported yet)"
          title="Attachments aren't supported by this chatbot yet"
          disabled
        >
          <Icon name="paperclip" size={19} />
        </button>
        <textarea
          ref={ref}
          rows={1}
          maxLength={max}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            e.target.style.height = "25px";
            e.target.style.height = `${Math.min(e.target.scrollHeight, 110)}px`;
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Ask NEXORA anything..."
        />
        <span className="shortcut">
          <kbd>⌘</kbd>
          <kbd>↵</kbd>
        </span>
        <button className="send-btn" disabled={!text.trim() || busy} aria-label="Send message">
          <Icon name="arrowUp" size={18} />
        </button>
      </form>
      <p>NEXORA can make mistakes. Verify important information.</p>
    </div>
  );
}

function HistoryScreen({
  conversations,
  onOpen,
  onClear,
}: {
  conversations: Conversation[];
  onOpen: (id: string) => void;
  onClear: () => void;
}) {
  return (
    <section className="content-page">
      <div className="page-heading">
        <span className="page-icon">
          <Icon name="history" />
        </span>
        <div>
          <h2>Conversation history</h2>
          <p>Continue where you left off, or revisit an earlier idea.</p>
        </div>
        <button className="secondary-btn" onClick={onClear} disabled={!conversations.length}>
          <Icon name="trash" size={15} />
          Clear history
        </button>
      </div>
      <div className="history-table">
        <div className="table-head">
          <span>Conversation</span>
          <span>Last opened</span>
          <span>Messages</span>
          <span />
        </div>
        {conversations.length === 0 && (
          <div className="history-row" style={{ cursor: "default" }}>
            <span>No conversations yet. Ask NEXORA something to get started.</span>
          </div>
        )}
        {conversations.map((item, i) => (
          <button className="history-row" key={item.id} onClick={() => onOpen(item.id)}>
            <span>
              <i className="history-glyph">
                <Icon name={i % 3 === 0 ? "code" : i % 3 === 1 ? "bulb" : "book"} size={17} />
              </i>
              <span>
                <strong>{item.title}</strong>
                <small>{item.preview ? `${item.preview}…` : "No messages yet"}</small>
              </span>
            </span>
            <span>{relTime(item.updated_at)}</span>
            <span>{item.message_count ?? 0}</span>
            <Icon name="chevron" size={16} />
          </button>
        ))}
      </div>
    </section>
  );
}

function SearchScreen({ all, onOpen }: { all: Conversation[]; onOpen: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "today" | "week">("all");
  const [found, setFound] = useState<Conversation[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setFound(null);
      setFailed(false);
      return;
    }
    let cancelled = false;
    const t = window.setTimeout(() => {
      api
        .search(q)
        .then((r) => !cancelled && (setFound(r.results), setFailed(false)))
        .catch(() => !cancelled && setFailed(true));
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [query]);

  const base = found ?? all;
  const results = base.filter((c) => {
    if (filter === "all") return true;
    const g = groupOf(c.updated_at);
    return filter === "today" ? g === "Today" : g !== "Older";
  });

  return (
    <section className="content-page search-page">
      <div className="page-heading">
        <span className="page-icon">
          <Icon name="search" />
        </span>
        <div>
          <h2>Search conversations</h2>
          <p>Find anything you’ve explored with Nexora.</p>
        </div>
      </div>
      <label className="large-search">
        <Icon name="search" />
        <input
          autoFocus
          value={query}
          maxLength={100}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title or keyword..."
        />
        <kbd>ESC</kbd>
      </label>
      <div className="filter-row">
        <button className={`filter ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>
          All
        </button>
        <button className={`filter ${filter === "today" ? "active" : ""}`} onClick={() => setFilter("today")}>
          Today
        </button>
        <button className={`filter ${filter === "week" ? "active" : ""}`} onClick={() => setFilter("week")}>
          Last 7 days
        </button>
        <span>{failed ? "Search unavailable" : `${results.length} conversations`}</span>
      </div>
      <div className="search-results">
        {results.map((item, i) => (
          <button key={item.id} onClick={() => onOpen(item.id)}>
            <span className="result-icon">
              <Icon name={i % 2 ? "bulb" : "code"} />
            </span>
            <span>
              <strong>{item.title}</strong>
              <p>{item.preview ? `${item.preview}…` : "No messages yet"}</p>
              <small>
                {groupOf(item.updated_at)} · {item.message_count ?? 0} messages
              </small>
            </span>
            <Icon name="chevron" size={16} />
          </button>
        ))}
      </div>
    </section>
  );
}

function Toggle({ value, onChange, label }: { value: boolean; onChange: () => void; label: string }) {
  return (
    <button
      className={`switch ${value ? "on" : ""}`}
      onClick={onChange}
      role="switch"
      aria-checked={value}
      aria-label={label}
    >
      <span />
    </button>
  );
}

const PREFS_KEY = "nexora-prefs";

function SettingsScreen({
  profile = false,
  displayName,
  onSaveName,
  onDelete,
}: {
  profile?: boolean;
  displayName: string;
  onSaveName: (name: string) => Promise<void>;
  onDelete: () => void;
}) {
  const [prefs, setPrefs] = useState(() => {
    try {
      return { memory: true, sounds: false, training: false, ...JSON.parse(localStorage.getItem(PREFS_KEY) || "{}") };
    } catch {
      return { memory: true, sounds: false, training: false };
    }
  });
  const [name, setName] = useState(displayName);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  const save = async () => {
    setSaveError("");
    try {
      if (profile) await onSaveName(name.trim());
      else localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1800);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Could not save");
    }
  };

  return (
    <section className="content-page settings-page">
      <div className="page-heading">
        <span className="page-icon">
          <Icon name={profile ? "user" : "settings"} />
        </span>
        <div>
          <h2>{profile ? "Profile settings" : "Application settings"}</h2>
          <p>
            {profile
              ? "Manage how you appear in NEXORA."
              : "Personalise how Nexora works for you."}
          </p>
        </div>
      </div>
      <div className="settings-layout">
        <aside className="settings-tabs">
          <button className="active">
            <Icon name={profile ? "user" : "sliders"} />
            {profile ? "Personal details" : "General"}
            <Icon name="chevron" size={14} />
          </button>
        </aside>
        <div className="settings-panel">
          {profile ? (
            <>
              <div className="profile-editor">
                <Avatar name={name || displayName} />
                <div>
                  <strong>Guest session</strong>
                  <p>Your conversations are saved to this browser’s session.</p>
                </div>
              </div>
              <div className="form-grid">
                <label className="full">
                  Display name
                  <input value={name} maxLength={40} onChange={(e) => setName(e.target.value)} />
                </label>
              </div>
            </>
          ) : (
            <>
              <div className="setting-section">
                <h3>Conversation experience</h3>
                <p>Preferences are stored in this browser.</p>
                <div className="setting-row">
                  <span>
                    <strong>Conversation memory</strong>
                    <small>Remember useful details across your conversations.</small>
                  </span>
                  <Toggle label="Conversation memory" value={prefs.memory} onChange={() => setPrefs({ ...prefs, memory: !prefs.memory })} />
                </div>
                <div className="setting-row">
                  <span>
                    <strong>Response sounds</strong>
                    <small>Play a subtle sound when a response is complete.</small>
                  </span>
                  <Toggle label="Response sounds" value={prefs.sounds} onChange={() => setPrefs({ ...prefs, sounds: !prefs.sounds })} />
                </div>
              </div>
              <div className="danger-zone">
                <span>
                  <strong>Delete all conversations</strong>
                  <small>This permanently removes your conversation history.</small>
                </span>
                <button onClick={onDelete}>Delete history</button>
              </div>
            </>
          )}
          <div className="settings-footer">
            <span className={saved || saveError ? "save-note visible" : "save-note"}>
              {saveError ? (
                saveError
              ) : (
                <>
                  <Icon name="check" size={14} /> Changes saved
                </>
              )}
            </span>
            <button className="primary-btn" onClick={save} disabled={profile && !name.trim()}>
              Save changes
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function ConfirmModal({
  title,
  body,
  confirmLabel,
  busy,
  error,
  onConfirm,
  onClose,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  busy: boolean;
  error: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div className="modal" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
        <button className="icon-btn modal-close" onClick={onClose} aria-label="Close">
          <Icon name="close" />
        </button>
        <span className="danger-icon">
          <Icon name="trash" />
        </span>
        <h3>{title}</h3>
        <p>{error || body}</p>
        <div>
          <button className="secondary-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="danger-btn" onClick={onConfirm} disabled={busy}>
            {busy ? "Deleting…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

type Pending = { kind: "all" } | { kind: "one"; id: string; title: string } | null;

export default function App() {
  const [theme, setTheme] = useState<"dark" | "light">(() =>
    localStorage.getItem("nexora-theme") === "light" ? "light" : "dark",
  );
  const [screen, setScreen] = useState("empty");
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [displayName, setDisplayName] = useState("Guest");
  const [maxChars, setMaxChars] = useState(2000);
  const [online, setOnline] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState<{ message: string; text: string } | null>(null);
  const [pending, setPending] = useState<Pending>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Bumped whenever the visible conversation changes, so a slow reply never lands in the wrong chat.
  const view = useRef(0);

  const activeTitle = conversations.find((c) => c.id === activeId)?.title;
  const title = useMemo(
    () =>
      screen === "chat"
        ? activeTitle || "New conversation"
        : ({
            empty: "New conversation",
            history: "History",
            search: "Search",
            profile: "Your profile",
            settings: "Settings",
          } as Record<string, string>)[screen] || "Nexora AI",
    [screen, activeTitle],
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("nexora-theme", theme);
  }, [theme]);

  const refreshList = useCallback(async () => {
    const r = await api.conversations();
    setConversations(r.conversations);
  }, []);

  useEffect(() => {
    loadSession()
      .then((s) => {
        setDisplayName(s.display_name);
        setMaxChars(s.max_message_chars);
        setOnline(true);
        return refreshList();
      })
      .catch(() => setOnline(false));
  }, [refreshList]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setScreen("search");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const navigate = (next: string) => {
    if (next === "empty") {
      view.current++;
      setActiveId(null);
      setMessages([]);
      setTyping(false);
    }
    setScreen(next);
    setDrawerOpen(false);
    setError(null);
    if (next === "history" || next === "search") refreshList().catch(() => setOnline(false));
  };

  const openConversation = async (id: string) => {
    const mine = ++view.current;
    setDrawerOpen(false);
    setError(null);
    setTyping(false);
    try {
      const r = await api.conversation(id);
      if (mine !== view.current) return;
      setActiveId(id);
      setMessages(r.messages);
      setScreen("chat");
      setOnline(true);
    } catch (e) {
      if (mine !== view.current) return;
      setScreen("chat");
      setActiveId(id);
      setMessages([]);
      setError({ message: e instanceof Error ? e.message : "Could not load conversation.", text: "" });
    }
  };

  const send = async (text: string) => {
    if (typing) return; // one request at a time
    const mine = view.current;
    const tempId = `tmp-${Date.now()}`;
    setScreen("chat");
    setError(null);
    setTyping(true);
    setMessages((m) => [...m, { id: tempId, role: "user", content: text, topic: null, created_at: new Date().toISOString() }]);
    try {
      const r = await api.chat(text, activeId);
      setOnline(true);
      if (mine === view.current) {
        setActiveId(r.conversation.id);
        setMessages((m) => [...m.filter((x) => x.id !== tempId), r.user_message, r.assistant_message]);
        setTyping(false);
      }
      refreshList().catch(() => undefined);
    } catch (e) {
      if (mine !== view.current) return;
      setTyping(false);
      setOnline(!(e instanceof ApiError && e.status === 0));
      setMessages((m) => m.filter((x) => x.id !== tempId)); // not stored server-side; retry re-adds it
      setError({ message: e instanceof Error ? e.message : "Something went wrong.", text });
    }
  };

  const confirmDelete = async () => {
    if (!pending) return;
    setDeleting(true);
    setDeleteError("");
    try {
      if (pending.kind === "all") {
        await api.deleteAll();
        view.current++;
        setActiveId(null);
        setMessages([]);
        setScreen("empty");
      } else {
        await api.deleteConversation(pending.id);
        if (pending.id === activeId) {
          view.current++;
          setActiveId(null);
          setMessages([]);
          setScreen("empty");
        }
      }
      await refreshList();
      setPending(null);
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Could not delete.");
    } finally {
      setDeleting(false);
    }
  };

  const askDeleteOne = (id: string) => {
    const c = conversations.find((x) => x.id === id);
    setDeleteError("");
    setPending({ kind: "one", id, title: c?.title ?? "this conversation" });
  };
  const askDeleteAll = () => {
    setDeleteError("");
    setPending({ kind: "all" });
  };

  const saveName = async (name: string) => {
    const r = await api.saveProfile(name);
    setDisplayName(r.display_name);
  };

  return (
    <div className="app-shell">
      <Sidebar
        collapsed={collapsed}
        drawerOpen={drawerOpen}
        current={screen}
        activeId={activeId}
        conversations={conversations}
        displayName={displayName}
        onNavigate={navigate}
        onOpen={openConversation}
        onDeleteOne={askDeleteOne}
        onCollapse={() => setCollapsed(!collapsed)}
        onClose={() => setDrawerOpen(false)}
      />
      {drawerOpen && (
        <button className="drawer-scrim" onClick={() => setDrawerOpen(false)} aria-label="Close navigation" />
      )}
      <main className="main-area">
        <Topbar
          title={title}
          theme={theme}
          online={online}
          displayName={displayName}
          onTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
          onNew={() => navigate("empty")}
          onMenu={() => setDrawerOpen(true)}
          onProfile={() => navigate("profile")}
        />
        <div className={`workspace ${["chat", "empty"].includes(screen) ? "chat-workspace" : ""}`}>
          {screen === "empty" && <EmptyChat onSelect={send} />}
          {screen === "chat" && <ActiveChat messages={messages} typing={typing} displayName={displayName} />}
          {screen === "history" && (
            <HistoryScreen conversations={conversations} onOpen={openConversation} onClear={askDeleteAll} />
          )}
          {screen === "search" && <SearchScreen all={conversations} onOpen={openConversation} />}
          {screen === "profile" && (
            <SettingsScreen profile displayName={displayName} onSaveName={saveName} onDelete={askDeleteAll} />
          )}
          {screen === "settings" && (
            <SettingsScreen displayName={displayName} onSaveName={saveName} onDelete={askDeleteAll} />
          )}
          {error && (
            <ErrorState
              message={error.message}
              onRetry={() => {
                const t = error.text;
                setError(null);
                if (t) void send(t);
                else if (activeId) void openConversation(activeId);
              }}
            />
          )}
        </div>
        {["chat", "empty"].includes(screen) && <Composer onSend={send} busy={typing} max={maxChars} />}
      </main>
      {pending && (
        <ConfirmModal
          title={pending.kind === "all" ? "Delete conversation history?" : "Delete this conversation?"}
          body={
            pending.kind === "all"
              ? "This will permanently delete all your conversations. This action cannot be undone."
              : `“${pending.title}” will be permanently deleted. This action cannot be undone.`
          }
          confirmLabel={pending.kind === "all" ? "Delete everything" : "Delete"}
          busy={deleting}
          error={deleteError}
          onConfirm={confirmDelete}
          onClose={() => setPending(null)}
        />
      )}
    </div>
  );
}
