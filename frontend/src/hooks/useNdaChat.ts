import { useCallback, useState } from "react";
import type { ChatMessage } from "@/lib/chat";
import {
  applyNdaFieldsPatch,
  INITIAL_ASSISTANT_MESSAGE,
  sendNdaChatMessage,
} from "@/lib/ndaChat";
import { defaultNdaFormData, type NdaFormData } from "@/lib/nda";

export interface UseNdaChatResult {
  messages: ChatMessage[];
  fields: NdaFormData;
  isSending: boolean;
  error: string | null;
  sendMessage: (text: string) => Promise<void>;
  retry: () => Promise<void>;
  setFields: (fields: NdaFormData) => void;
}

export function useNdaChat(): UseNdaChatResult {
  const [messages, setMessages] = useState<ChatMessage[]>([
    INITIAL_ASSISTANT_MESSAGE,
  ]);
  const [fields, setFields] = useState<NdaFormData>(defaultNdaFormData);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runTurn = useCallback(
    async (nextMessages: ChatMessage[]) => {
      setIsSending(true);
      setError(null);
      try {
        const result = await sendNdaChatMessage({
          messages: nextMessages,
          currentFields: fields,
        });
        setMessages([
          ...nextMessages,
          { role: "assistant", content: result.reply },
        ]);
        setFields((prev) => applyNdaFieldsPatch(prev, result.fields));
      } catch {
        setMessages(nextMessages);
        setError(
          "Something went wrong talking to the assistant. Please try again."
        );
      } finally {
        setIsSending(false);
      }
    },
    [fields]
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

  return { messages, fields, isSending, error, sendMessage, retry, setFields };
}
