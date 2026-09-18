import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, postJson } from "./api";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("postJson", () => {
  it("returns parsed JSON on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ hello: "world" }),
      })
    );

    const result = await postJson<{ hello: string }>("/api/test", { a: 1 });
    expect(result).toEqual({ hello: "world" });
  });

  it("throws an ApiError with the status on a non-OK response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({}),
      })
    );

    await expect(postJson("/api/test", {})).rejects.toMatchObject({
      status: 503,
    });
  });

  it("throws an ApiError on a network failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("boom")));

    await expect(postJson("/api/test", {})).rejects.toBeInstanceOf(ApiError);
  });

  it("throws an ApiError with a timeout message when the request aborts", async () => {
    const abortError = new DOMException("Aborted", "AbortError");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(abortError));

    await expect(postJson("/api/test", {})).rejects.toMatchObject({
      message: "Request timed out",
    });
  });
});
