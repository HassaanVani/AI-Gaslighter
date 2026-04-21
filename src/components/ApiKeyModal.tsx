"use client";

import { useState } from "react";

interface ApiKeyModalProps {
  onSubmit: (apiKey: string) => void;
}

export default function ApiKeyModal({ onSubmit }: ApiKeyModalProps) {
  const [key, setKey] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (key.trim()) onSubmit(key.trim());
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "var(--bg-primary)" }}
    >
      <div className="animate-slide-up w-full max-w-md px-6">
        {/* Sparkle icon */}
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: "var(--accent-dim)" }}
          >
            <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
              <path
                d="M14 0C14 7.732 7.732 14 0 14C7.732 14 14 20.268 14 28C14 20.268 20.268 14 28 14C20.268 14 14 7.732 14 0Z"
                fill="var(--accent)"
              />
            </svg>
          </div>
        </div>

        <h1
          className="text-2xl font-light text-center mb-2"
          style={{ color: "var(--text-primary)" }}
        >
          AI Gaslighter
        </h1>
        <p
          className="text-sm text-center mb-8 leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        >
          Enter your OpenAI API key to start. Your key is sent directly to
          OpenAI and is never stored.
        </p>

        <form onSubmit={handleSubmit}>
          <input
            id="api-key-input"
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="sk-..."
            autoFocus
            className="w-full rounded-2xl px-5 py-3.5 text-sm outline-none transition-colors duration-200"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-input)",
              color: "var(--text-primary)",
              fontFamily: "var(--font-mono)",
            }}
            onFocus={(e) =>
              (e.target.style.borderColor = "var(--accent)")
            }
            onBlur={(e) =>
              (e.target.style.borderColor = "var(--border-input)")
            }
          />

          <button
            id="submit-api-key"
            type="submit"
            disabled={!key.trim()}
            className="w-full mt-4 rounded-2xl px-5 py-3.5 text-sm font-medium transition-all duration-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: key.trim() ? "var(--accent)" : "var(--bg-surface)",
              color: key.trim() ? "#131314" : "var(--text-hint)",
            }}
          >
            Continue
          </button>
        </form>

        <div
          className="mt-8 rounded-2xl p-5 text-xs leading-relaxed"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            color: "var(--text-secondary)",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <svg width="14" height="14" viewBox="0 0 28 28" fill="none">
              <path
                d="M14 0C14 7.732 7.732 14 0 14C7.732 14 14 20.268 14 28C14 20.268 20.268 14 28 14C20.268 14 14 7.732 14 0Z"
                fill="var(--accent)"
              />
            </svg>
            <span className="font-medium" style={{ color: "var(--accent)" }}>
              How this works
            </span>
          </div>
          LLM APIs are stateless — every request includes the full conversation
          history. Edit what the AI &quot;said&quot; and it has no way to tell. It will
          believe the edit completely.
        </div>
      </div>
    </div>
  );
}
