import { beforeEach, describe, expect, it, vi } from "vitest";
import { isAuthenticated, setAuthenticated } from "./auth";

function createSessionStorageStub() {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
}

beforeEach(() => {
  vi.stubGlobal("window", { sessionStorage: createSessionStorageStub() });
});

describe("auth", () => {
  it("starts unauthenticated", () => {
    expect(isAuthenticated()).toBe(false);
  });

  it("becomes authenticated after setAuthenticated", () => {
    setAuthenticated();
    expect(isAuthenticated()).toBe(true);
  });
});
