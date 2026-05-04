"use client";

import { useState, useRef, useEffect } from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!disabled && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setValue("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <div className="px-4 pb-8 pt-2">
      <div className="max-w-3xl mx-auto">
        {/* Input container — Gemini pill shape */}
        <div
          className="relative flex items-end rounded-3xl transition-colors duration-200"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-input)",
          }}
        >
          <textarea
            id="chat-input"
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
            }}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? "Waiting for response..." : "Enter a prompt here"}
            disabled={disabled}
            rows={1}
            className="flex-1 bg-transparent text-sm outline-none resize-none px-6 py-4 disabled:opacity-40 placeholder:text-[var(--text-secondary)]"
            style={{
              color: "var(--text-primary)",
              lineHeight: "1.5",
              maxHeight: "160px",
            }}
          />

          {/* Send button */}
          <button
            id="send-button"
            onClick={handleSubmit}
            disabled={!canSend}
            className="shrink-0 mr-3 mb-3 rounded-full w-9 h-9 flex items-center justify-center transition-all duration-200 cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed"
            style={{
              background: canSend ? "var(--accent)" : "var(--bg-surface-hover)",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke={canSend ? "#131314" : "var(--text-hint)"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="19" x2="12" y2="5" />
              <polyline points="5 12 12 5 19 12" />
            </svg>
          </button>
        </div>

        {/* Disclaimer */}
        <p
          className="text-center mt-3 text-xs"
          style={{ color: "var(--text-secondary)" }}
        >
          AI Gaslighter may display inaccurate info. Double-click AI responses to edit them.
        </p>
      </div>
    </div>
  );
}
