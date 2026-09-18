import { postJson } from "./api";
import type { ChatMessage } from "./chat";
import type { NdaFormData } from "./nda";

export const MUTUAL_NDA_CHAT_ENDPOINT = "/api/documents/mutual-nda/chat";

export type NdaFieldsPatch = Partial<NdaFormData>;

export interface NdaChatRequest {
  messages: ChatMessage[];
  currentFields: NdaFormData;
}

export interface NdaChatTurnResult {
  reply: string;
  fields: NdaFieldsPatch;
}

export const INITIAL_ASSISTANT_MESSAGE: ChatMessage = {
  role: "assistant",
  content:
    "Hi! I'll help you put together a Mutual NDA. Who are the two parties involved?",
};

/**
 * Merges AI-extracted fields onto the existing form data. The backend only
 * ever sends keys it actually extracted this turn, so a plain overwrite is
 * safe — it never clobbers a previously set field with an absent one.
 */
export function applyNdaFieldsPatch(
  current: NdaFormData,
  patch: NdaFieldsPatch
): NdaFormData {
  return { ...current, ...patch };
}

export function sendNdaChatMessage(
  request: NdaChatRequest
): Promise<NdaChatTurnResult> {
  return postJson<NdaChatTurnResult>(MUTUAL_NDA_CHAT_ENDPOINT, request);
}
