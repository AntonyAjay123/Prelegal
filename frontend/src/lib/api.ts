export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const DEFAULT_TIMEOUT_MS = 30_000;

export async function postJson<TResponse>(
  path: string,
  body: unknown,
  opts?: { timeoutMs?: number }
): Promise<TResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS
  );

  let response: Response;
  try {
    response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    if ((error as { name?: string } | null)?.name === "AbortError") {
      throw new ApiError("Request timed out");
    }
    throw new ApiError(
      error instanceof Error ? error.message : "Network request failed"
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new ApiError(
      `Request failed with status ${response.status}`,
      response.status
    );
  }

  return (await response.json()) as TResponse;
}
