"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ApiKeyModal from "@/components/ApiKeyModal";
import ChatInput from "@/components/ChatInput";
import ChatMessage, { Message } from "@/components/ChatMessage";

const SYSTEM_PROMPT = `You are a helpful assistant. Respond naturally and conversationally. Keep responses concise unless asked for detail.`;

const MODELS = [
  { id: "gpt-4o-mini", label: "GPT-4o mini" },
  { id: "gpt-4o", label: "GPT-4o" },
  { id: "gpt-4-turbo", label: "GPT-4 Turbo" },
] as const;

const SUGGESTIONS = [
  {
    icon: "🎨",
    title: "What's your favorite color?",
    subtitle: "Then edit the answer",
  },
  {
    icon: "🤫",
    title: "Tell me a secret about yourself",
    subtitle: "Then rewrite the secret",
  },
  {
    icon: "🤝",
    title: "Make me a promise",
    subtitle: "Then change the promise",
  },
  {
    icon: "📝",
    title: "Describe yourself in 3 words",
    subtitle: "Then swap the words",
  },
];

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

export default function Home() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>(MODELS[0].id);
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const modelMenuRef = useRef<HTMLDivElement>(null);

  const editCount = messages.filter((m) => m.isEdited).length;
  const currentModel = MODELS.find((m) => m.id === selectedModel) || MODELS[0];

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Restore key from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem("gaslight-api-key");
    if (stored) setApiKey(stored);
  }, []);

  // Close model menu on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        modelMenuRef.current &&
        !modelMenuRef.current.contains(e.target as Node)
      ) {
        setModelMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleApiKey = (key: string) => {
    setApiKey(key);
    sessionStorage.setItem("gaslight-api-key", key);
  };

  const sendMessage = useCallback(
    async (content: string) => {
      if (!apiKey || isStreaming) return;

      const userMessage: Message = {
        id: generateId(),
        role: "user",
        content,
      };

      const assistantMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: "",
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setIsStreaming(true);
      setStreamingId(assistantMessage.id);

      const apiMessages = [
        { role: "system" as const, content: SYSTEM_PROMPT },
        ...[...messages, userMessage].map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ];

      try {
        abortRef.current = new AbortController();
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
          },
          body: JSON.stringify({
            messages: apiMessages,
            model: selectedModel,
          }),
          signal: abortRef.current.signal,
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Request failed");
        }

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        if (!reader) throw new Error("No response body");

        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data: ")) continue;
            const data = trimmed.slice(6);
            if (data === "[DONE]") break;

            try {
              const parsed = JSON.parse(data);
              if (parsed.error) throw new Error(parsed.error);
              if (parsed.content) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMessage.id
                      ? { ...m, content: m.content + parsed.content }
                      : m
                  )
                );
              }
            } catch {
              // skip malformed SSE chunks
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessage.id
              ? {
                  ...m,
                  content: `Error: ${err instanceof Error ? err.message : "Unknown error"}`,
                }
              : m
          )
        );
      } finally {
        setIsStreaming(false);
        setStreamingId(null);
        abortRef.current = null;
      }
    },
    [apiKey, isStreaming, messages, selectedModel]
  );

  const handleEdit = useCallback((id: string, newContent: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              content: newContent,
              originalContent: m.originalContent || m.content,
              isEdited: true,
            }
          : m
      )
    );
  }, []);

  if (!apiKey) {
    return <ApiKeyModal onSubmit={handleApiKey} />;
  }

  const apiContext = [
    { role: "system", content: SYSTEM_PROMPT },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  return (
    <div
      className="h-screen flex flex-col"
      style={{ background: "var(--bg-primary)" }}
    >
      {/* ── Header ── */}
      <header
        className="shrink-0 flex items-center justify-between px-5 py-3"
        style={{
          borderBottom: "1px solid var(--border)",
        }}
      >
        {/* Left: app name */}
        <div className="flex items-center gap-3">
          <svg width="18" height="18" viewBox="0 0 28 28" fill="none">
            <defs>
              <linearGradient id="hdr-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4285f4" />
                <stop offset="50%" stopColor="#9b72cb" />
                <stop offset="100%" stopColor="#d96570" />
              </linearGradient>
            </defs>
            <path
              d="M14 0C14 7.732 7.732 14 0 14C7.732 14 14 20.268 14 28C14 20.268 20.268 14 28 14C20.268 14 14 7.732 14 0Z"
              fill="url(#hdr-grad)"
            />
          </svg>
          <span
            className="text-base font-normal"
            style={{ color: "var(--text-primary)" }}
          >
            AI Gaslighter
          </span>
        </div>

        {/* Center: model selector */}
        <div className="relative" ref={modelMenuRef}>
          <button
            id="model-selector"
            onClick={() => setModelMenuOpen(!modelMenuOpen)}
            className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
            style={{
              color: "var(--text-secondary)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--bg-surface-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            {currentModel.label}
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transform: modelMenuOpen ? "rotate(180deg)" : "none",
                transition: "transform 0.2s",
              }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {modelMenuOpen && (
            <div
              className="animate-fade-in-fast absolute top-full left-1/2 -translate-x-1/2 mt-1 rounded-xl py-1 min-w-[160px] z-50"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
              }}
            >
              {MODELS.map((model) => (
                <button
                  key={model.id}
                  onClick={() => {
                    setSelectedModel(model.id);
                    setModelMenuOpen(false);
                  }}
                  className="w-full text-left text-sm px-4 py-2.5 transition-colors cursor-pointer flex items-center justify-between"
                  style={{
                    color:
                      model.id === selectedModel
                        ? "var(--accent)"
                        : "var(--text-primary)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--bg-surface-hover)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  {model.label}
                  {model.id === selectedModel && (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--accent)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1">
          {editCount > 0 && (
            <span
              className="text-xs font-medium mr-2 px-2.5 py-1 rounded-full"
              style={{
                color: "var(--tamper-color)",
                background: "var(--tamper-bg)",
                border: "1px solid var(--tamper-border)",
              }}
            >
              {editCount} tampered
            </span>
          )}

          {/* Context inspector toggle */}
          <button
            id="toggle-inspector"
            onClick={() => setInspectorOpen(!inspectorOpen)}
            className="p-2 rounded-xl transition-colors cursor-pointer"
            title="View raw API context"
            style={{
              color: inspectorOpen ? "var(--accent)" : "var(--text-hint)",
              background: inspectorOpen ? "var(--accent-dim)" : "transparent",
            }}
            onMouseEnter={(e) => {
              if (!inspectorOpen) e.currentTarget.style.background = "var(--bg-surface-hover)";
            }}
            onMouseLeave={(e) => {
              if (!inspectorOpen) e.currentTarget.style.background = "transparent";
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
          </button>

          {/* New chat */}
          <button
            id="new-chat"
            onClick={() => setMessages([])}
            className="p-2 rounded-xl transition-colors cursor-pointer"
            title="New chat"
            style={{ color: "var(--text-hint)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--bg-surface-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>

          {/* Change key */}
          <button
            id="change-key"
            onClick={() => {
              sessionStorage.removeItem("gaslight-api-key");
              setApiKey(null);
            }}
            className="p-2 rounded-xl transition-colors cursor-pointer"
            title="Change API key"
            style={{ color: "var(--text-hint)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--bg-surface-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.78 7.78 5.5 5.5 0 0 1 7.78-7.78zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
            </svg>
          </button>
        </div>
      </header>

      {/* ── Main content area ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto"
          style={{
            transition: "margin-right 0.3s ease",
            marginRight: inspectorOpen ? "384px" : "0",
          }}
        >
          {messages.length === 0 ? (
            /* ── Empty state ── */
            <div className="flex flex-col items-center justify-center h-full px-4">
              <div className="max-w-2xl w-full text-center">
                <h1
                  className="gradient-text text-5xl font-light mb-3"
                  style={{ letterSpacing: "-0.02em" }}
                >
                  Hello there
                </h1>
                <p
                  className="text-lg font-light mb-12"
                  style={{ color: "var(--text-secondary)" }}
                >
                  How can I help you today?
                </p>

                {/* Suggestion cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
                  {SUGGESTIONS.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(s.title)}
                      className="text-left rounded-2xl p-4 transition-colors cursor-pointer"
                      style={{
                        background: "var(--bg-surface)",
                        border: "1px solid var(--border)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--bg-surface-hover)";
                        e.currentTarget.style.borderColor = "var(--border-hover)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "var(--bg-surface)";
                        e.currentTarget.style.borderColor = "var(--border)";
                      }}
                    >
                      <div className="text-2xl mb-3">{s.icon}</div>
                      <div
                        className="text-sm font-normal mb-1"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {s.title}
                      </div>
                      <div
                        className="text-xs"
                        style={{ color: "var(--text-hint)" }}
                      >
                        {s.subtitle}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* ── Messages ── */
            <div className="py-4">
              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  onEdit={handleEdit}
                  isStreaming={streamingId === msg.id}
                />
              ))}

              {/* Typing indicator (before first token) */}
              {isStreaming &&
                streamingId &&
                messages.find((m) => m.id === streamingId)?.content === "" && (
                  <div className="px-4 py-4 max-w-3xl mx-auto">
                    <div className="flex gap-4">
                      <div className="shrink-0">
                        <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
                          <defs>
                            <linearGradient id="typing-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#4285f4" />
                              <stop offset="50%" stopColor="#9b72cb" />
                              <stop offset="100%" stopColor="#d96570" />
                            </linearGradient>
                          </defs>
                          <path
                            d="M14 0C14 7.732 7.732 14 0 14C7.732 14 14 20.268 14 28C14 20.268 20.268 14 28 14C20.268 14 14 7.732 14 0Z"
                            fill="url(#typing-grad)"
                          />
                        </svg>
                      </div>
                      <div className="flex gap-1.5 items-center py-2">
                        <div className="typing-dot" />
                        <div className="typing-dot" />
                        <div className="typing-dot" />
                      </div>
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>

        {/* ── Context Inspector panel ── */}
        <div
          className="fixed top-0 right-0 bottom-0 z-20 overflow-hidden transition-all duration-300 ease-in-out"
          style={{
            width: inspectorOpen ? "384px" : "0",
            borderLeft: inspectorOpen ? "1px solid var(--border)" : "none",
          }}
        >
          <div
            className="h-full overflow-y-auto p-5"
            style={{
              background: "var(--bg-primary)",
              width: "384px",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-sm font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                Raw API Context
              </h3>
              <button
                onClick={() => setInspectorOpen(false)}
                className="p-1.5 rounded-lg transition-colors cursor-pointer"
                style={{ color: "var(--text-hint)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--bg-surface-hover)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <p
              className="text-xs mb-4 leading-relaxed"
              style={{ color: "var(--text-hint)" }}
            >
              This is exactly what gets sent to OpenAI on the next request.
              Edited messages show the tampered content — the model has no way
              to distinguish them from real responses.
            </p>

            <pre
              className="text-xs rounded-xl p-4 overflow-x-auto"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                color: "var(--text-secondary)",
                fontFamily: "var(--font-mono)",
                lineHeight: "1.6",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {JSON.stringify(apiContext, null, 2)}
            </pre>
          </div>
        </div>
      </div>

      {/* ── Input ── */}
      <ChatInput onSend={sendMessage} disabled={isStreaming} />
    </div>
  );
}
