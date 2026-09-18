import { afterEach, describe, expect, it, vi } from "vitest";
import {
  renderDocument,
  sendDocumentMessage,
  sendIntakeMessage,
} from "./documentChat";

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubFetch(body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => body,
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("sendIntakeMessage", () => {
  it("posts to the intake endpoint", async () => {
    const fetchMock = stubFetch({ reply: "hi" });

    const result = await sendIntakeMessage([]);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/documents/chat",
      expect.objectContaining({ method: "POST" })
    );
    expect(result).toEqual({ reply: "hi" });
  });
});

describe("sendDocumentMessage", () => {
  it("posts to the per-document chat endpoint with the slug in the path", async () => {
    const fetchMock = stubFetch({
      reply: "hi",
      fields: {},
      allFields: [],
      content: "doc text",
    });

    await sendDocumentMessage("csa", [], {});

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/documents/csa/chat",
      expect.objectContaining({ method: "POST" })
    );
  });
});

describe("renderDocument", () => {
  it("posts to the per-document render endpoint with the slug in the path", async () => {
    const fetchMock = stubFetch({ content: "doc text" });

    const result = await renderDocument("csa", { Customer: "Acme Inc" });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/documents/csa/render",
      expect.objectContaining({ method: "POST" })
    );
    expect(result).toEqual({ content: "doc text" });
  });
});
