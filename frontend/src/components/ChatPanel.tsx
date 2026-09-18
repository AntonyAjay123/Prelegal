"use client";

import { useState } from "react";
import type { ChatMessage } from "@/lib/chat";

interface ChatPanelProps {
  messages: ChatMessage[];
  isSending: boolean;
  error: string | null;
  onSend: (text: string) => void;
  onRetry: () => void;
}

export default function ChatPanel({
  messages,
  isSending,
  error,
  onSend,
  onRetry,
}: ChatPanelProps) {
  const [input, setInput] = useState("");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text || isSending) return;
    onSend(text);
    setInput("");
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-base font-semibold text-dark-navy dark:text-zinc-50">
        Chat with the assistant
      </h2>
      <div className="flex max-h-96 flex-col gap-3 overflow-y-auto">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
              message.role === "user"
                ? "self-end bg-blue-primary text-white"
                : "self-start bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
            }`}
          >
            {message.content}
          </div>
        ))}
        {isSending && (
          <div className="self-start rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            Thinking…
          </div>
        )}
      </div>
      {error && (
        <div className="flex items-center justify-between gap-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-400">
          <span>{error}</span>
          <button
            type="button"
            onClick={onRetry}
            className="shrink-0 font-medium underline"
          >
            Retry
          </button>
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-blue-primary focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your answer..."
          disabled={isSending}
        />
        <button
          type="submit"
          disabled={isSending || !input.trim()}
          className="shrink-0 rounded-full bg-purple-secondary px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </div>
  );
}
