import { afterEach, describe, expect, it, vi } from "vitest";
import { defaultNdaFormData } from "./nda";
import {
  applyNdaFieldsPatch,
  MUTUAL_NDA_CHAT_ENDPOINT,
  sendNdaChatMessage,
} from "./ndaChat";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("applyNdaFieldsPatch", () => {
  it("overwrites only the keys present in the patch", () => {
    const current = { ...defaultNdaFormData, party1Name: "Jane" };
    const result = applyNdaFieldsPatch(current, { party2Name: "John" });
    expect(result).toEqual({ ...current, party2Name: "John" });
  });

  it("leaves fields unchanged when the patch is empty", () => {
    const current = { ...defaultNdaFormData, governingLaw: "Delaware" };
    expect(applyNdaFieldsPatch(current, {})).toEqual(current);
  });

  it("overwrites a previously set field when the patch changes it", () => {
    const current = { ...defaultNdaFormData, jurisdiction: "New Castle, DE" };
    const result = applyNdaFieldsPatch(current, {
      jurisdiction: "San Francisco, CA",
    });
    expect(result.jurisdiction).toBe("San Francisco, CA");
  });
});

describe("sendNdaChatMessage", () => {
  it("posts to the mutual-nda chat endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ reply: "hi", fields: {} }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await sendNdaChatMessage({
      messages: [],
      currentFields: defaultNdaFormData,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      MUTUAL_NDA_CHAT_ENDPOINT,
      expect.objectContaining({ method: "POST" })
    );
    expect(result).toEqual({ reply: "hi", fields: {} });
  });
});
