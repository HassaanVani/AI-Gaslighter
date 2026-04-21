"use client";

import { useState, useRef, useEffect } from "react";

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  originalContent?: string;
  isEdited?: boolean;
}

interface ChatMessageProps {
  message: Message;
  onEdit: (id: string, newContent: string) => void;
  isStreaming?: boolean;
}

/* Gemini sparkle icon */
function SparkleIcon({ size = 18, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      className={className}
    >
      <defs>
        <linearGradient id="sparkle-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4285f4" />
          <stop offset="50%" stopColor="#9b72cb" />
          <stop offset="100%" stopColor="#d96570" />
        </linearGradient>
      </defs>
      <path
        d="M14 0C14 7.732 7.732 14 0 14C7.732 14 14 20.268 14 28C14 20.268 20.268 14 28 14C20.268 14 14 7.732 14 0Z"
        fill="url(#sparkle-grad)"
      />
    </svg>
  );
}

export default function ChatMessage({
  message,
  onEdit,
  isStreaming,
}: ChatMessageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(message.content);
  const [showOriginal, setShowOriginal] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isAssistant = message.role === "assistant";
  const isUser = message.role === "user";

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    if (isAssistant && !isStreaming) {
      setEditValue(message.content);
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== message.content) {
      onEdit(message.id, trimmed);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(message.content);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") handleCancel();
    if (e.key === "Enter" && e.metaKey) handleSave();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
  };

  if (message.role === "system") return null;

  /* ── User message ── */
  if (isUser) {
    return (
      <div className="animate-fade-in flex justify-end px-4 py-1.5 max-w-3xl mx-auto">
        <div
          className="max-w-[80%] rounded-3xl px-5 py-3"
          style={{
            background: "var(--bg-user-bubble)",
          }}
        >
          <p
            className="text-sm whitespace-pre-wrap"
            style={{ color: "var(--text-primary)", lineHeight: "1.6" }}
          >
            {message.content}
          </p>
        </div>
      </div>
    );
  }

  /* ── Assistant message ── */
  return (
    <div className="animate-fade-in px-4 py-4 max-w-3xl mx-auto">
      <div className="group flex gap-4">
        {/* Sparkle avatar */}
        <div className="shrink-0 mt-0.5">
          <SparkleIcon size={20} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            /* ── Edit mode ── */
            <div>
              <textarea
                ref={textareaRef}
                value={editValue}
                onChange={(e) => {
                  setEditValue(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = e.target.scrollHeight + "px";
                }}
                onKeyDown={handleKeyDown}
                className="w-full rounded-xl p-4 text-sm outline-none resize-none"
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--accent)",
                  color: "var(--text-primary)",
                  lineHeight: "1.6",
                  minHeight: "60px",
                }}
              />
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={handleSave}
                  className="text-xs font-medium px-4 py-2 rounded-full transition-colors cursor-pointer"
                  style={{
                    background: "var(--tamper-color)",
                    color: "#131314",
                  }}
                >
                  Gaslight
                </button>
                <button
                  onClick={handleCancel}
                  className="text-xs px-4 py-2 rounded-full transition-colors cursor-pointer"
                  style={{
                    background: "var(--bg-surface-hover)",
                    color: "var(--text-secondary)",
                  }}
                >
                  Cancel
                </button>
                <span
                  className="text-xs ml-2"
                  style={{ color: "var(--text-hint)" }}
                >
                  ⌘↵ to save · Esc to cancel
                </span>
              </div>
            </div>
          ) : (
            /* ── Display mode ── */
            <>
              {/* Tampered badge */}
              {message.isEdited && (
                <div
                  className="inline-flex items-center gap-1.5 mb-2 text-[11px] font-medium px-2.5 py-1 rounded-full cursor-help"
                  style={{
                    background: "var(--tamper-bg)",
                    border: "1px solid var(--tamper-border)",
                    color: "var(--tamper-color)",
                  }}
                  onMouseEnter={() => setShowOriginal(true)}
                  onMouseLeave={() => setShowOriginal(false)}
                >
                  <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5L13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5z" />
                  </svg>
                  tampered
                </div>
              )}

              {/* Message text */}
              <div
                className="text-sm whitespace-pre-wrap"
                style={{ color: "var(--text-primary)", lineHeight: "1.7" }}
              >
                {message.content}
                {isStreaming && (
                  <span
                    className="inline-block w-[2px] h-[1em] ml-0.5 align-text-bottom"
                    style={{
                      background: "var(--accent)",
                      animation: "cursor-blink 1s step-end infinite",
                    }}
                  />
                )}
              </div>

              {/* Original content popover */}
              {showOriginal && message.originalContent && (
                <div
                  className="animate-fade-in-fast mt-3 rounded-xl p-4 text-xs"
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border)",
                    color: "var(--text-secondary)",
                    lineHeight: "1.6",
                  }}
                >
                  <div
                    className="text-[10px] uppercase tracking-wider font-medium mb-2"
                    style={{ color: "var(--text-hint)" }}
                  >
                    What the AI actually said
                  </div>
                  <div className="whitespace-pre-wrap">
                    {message.originalContent}
                  </div>
                </div>
              )}

              {/* Action bar — visible on hover */}
              {!isStreaming && (
                <div
                  className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                >
                  {/* Edit / Gaslight */}
                  <button
                    onClick={handleStartEdit}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-colors cursor-pointer"
                    style={{
                      color: "var(--text-secondary)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--bg-surface-hover)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                    title="Edit this response (gaslight the AI)"
                  >
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5L13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5z" />
                    </svg>
                    Edit
                  </button>

                  {/* Copy */}
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-colors cursor-pointer"
                    style={{
                      color: "var(--text-secondary)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--bg-surface-hover)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                    title="Copy to clipboard"
                  >
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z" />
                      <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z" />
                    </svg>
                    Copy
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
