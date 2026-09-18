import { useCallback, useState } from "react";
import type { ChatMessage } from "@/lib/chat";
import {
  INITIAL_ASSISTANT_MESSAGE,
  renderDocument,
  sendDocumentMessage,
  sendIntakeMessage,
} from "@/lib/documentChat";

export interface UseDocumentChatResult {
  messages: ChatMessage[];
  documentSlug: string | null;
  documentName: string | null;
  fields: Record<string, string>;
  allFields: string[];
  content: string;
  isSending: boolean;
  error: string | null;
  sendMessage: (text: string) => Promise<void>;
  retry: () => Promise<void>;
  setFieldValue: (label: string, value: string) => void;
  refreshPreview: () => Promise<void>;
}

export function useDocumentChat(): UseDocumentChatResult {
  const [messages, setMessages] = useState<ChatMessage[]>([
    INITIAL_ASSISTANT_MESSAGE,
  ]);
  const [documentSlug, setDocumentSlug] = useState<string | null>(null);
  const [documentName, setDocumentName] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [allFields, setAllFields] = useState<string[]>([]);
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runTurn = useCallback(
    async (nextMessages: ChatMessage[]) => {
      setIsSending(true);
      setError(null);
      try {
        if (!documentSlug) {
          const result = await sendIntakeMessage(nextMessages);
          setMessages([
            ...nextMessages,
            { role: "assistant", content: result.reply },
          ]);
          if (result.matchedSlug) {
            setDocumentSlug(result.matchedSlug);
            setDocumentName(result.documentName ?? result.matchedSlug);
          }
        } else {
          const result = await sendDocumentMessage(
            documentSlug,
            nextMessages,
            fields
          );
          setMessages([
            ...nextMessages,
            { role: "assistant", content: result.reply },
          ]);
          setFields((prev) => ({ ...prev, ...result.fields }));
          setAllFields(result.allFields);
          setContent(result.content);
        }
      } catch {
        setMessages(nextMessages);
        setError(
          "Something went wrong talking to the assistant. Please try again."
        );
      } finally {
        setIsSending(false);
      }
    },
    [documentSlug, fields]
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isSending) return;
      const nextMessages: ChatMessage[] = [
        ...messages,
        { role: "user", content: trimmed },
      ];
      await runTurn(nextMessages);
    },
    [messages, isSending, runTurn]
  );

  const retry = useCallback(async () => {
    if (isSending) return;
    await runTurn(messages);
  }, [messages, isSending, runTurn]);

  const setFieldValue = useCallback((label: string, value: string) => {
    setFields((prev) => ({ ...prev, [label]: value }));
  }, []);

  const refreshPreview = useCallback(async () => {
    if (!documentSlug) return;
    try {
      const result = await renderDocument(documentSlug, fields);
      setContent(result.content);
    } catch {
      // Best-effort: the preview will catch up on the next successful edit
      // or chat turn, so a failed refresh here doesn't need its own error UI.
    }
  }, [documentSlug, fields]);

  return {
    messages,
    documentSlug,
    documentName,
    fields,
    allFields,
    content,
    isSending,
    error,
    sendMessage,
    retry,
    setFieldValue,
    refreshPreview,
  };
}
