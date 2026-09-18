import { postJson } from "./api";
import type { ChatMessage } from "./chat";

export interface IntakeChatResult {
  reply: string;
  matchedSlug?: string;
  documentName?: string;
}

export interface DocumentChatResult {
  reply: string;
  fields: Record<string, string>;
  allFields: string[];
  content: string;
}

export const INITIAL_ASSISTANT_MESSAGE: ChatMessage = {
  role: "assistant",
  content:
    "Hi! I can help you draft a legal document. What kind of agreement do you need?",
};

export function sendIntakeMessage(
  messages: ChatMessage[]
): Promise<IntakeChatResult> {
  return postJson<IntakeChatResult>("/api/documents/chat", { messages });
}

export function sendDocumentMessage(
  slug: string,
  messages: ChatMessage[],
  currentFields: Record<string, string>
): Promise<DocumentChatResult> {
  return postJson<DocumentChatResult>(`/api/documents/${slug}/chat`, {
    messages,
    currentFields,
  });
}

export function renderDocument(
  slug: string,
  fields: Record<string, string>
): Promise<{ content: string }> {
  return postJson<{ content: string }>(`/api/documents/${slug}/render`, {
    fields,
  });
}
