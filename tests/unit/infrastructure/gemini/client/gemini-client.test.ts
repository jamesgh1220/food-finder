import { afterEach, describe, expect, it, vi } from "vitest";
import { createGeminiClient } from "@/infrastructure/gemini/client/gemini-client";

/**
 * Tests del cliente HTTP de Gemini (spec 09, REQ-03).
 *
 * Se reemplaza el `fetch` global con un stub para no tocar la red. Las
 * respuestas se modelan con objetos mínimos (no `Response`) para no depender
 * del entorno jsdom.
 */

interface FakeHttpResponse {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
  text: () => Promise<string>;
}

function httpResponse(payload: unknown, status = 200): FakeHttpResponse {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
    text: async () =>
      typeof payload === "string" ? payload : JSON.stringify(payload),
  };
}

/** Envuelve un texto en la forma `candidates[0].content.parts[0].text`. */
function candidate(text: string): unknown {
  return { candidates: [{ content: { parts: [{ text }] } }] };
}

type FetchImpl = (url: string, init: RequestInit) => Promise<unknown>;

function stubFetch(impl: FetchImpl) {
  const mock = vi.fn(impl);
  vi.stubGlobal("fetch", mock);
  return mock;
}

describe("createGeminiClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("devuelve el JSON parseado del texto del candidato", async () => {
    const fetchMock = stubFetch(async () =>
      httpResponse(candidate(JSON.stringify({ recipes: [{ name: "A" }] }))),
    );
    const client = createGeminiClient({ apiKey: "test-key" });

    const result = await client.generateContent("prompt");

    expect(result).toEqual({ recipes: [{ name: "A" }] });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain(":generateContent");
    expect((init.headers as Record<string, string>)["x-goog-api-key"]).toBe(
      "test-key",
    );
  });

  it("clasifica un AbortError como timeout", async () => {
    const abortError = Object.assign(new Error("aborted"), {
      name: "AbortError",
    });
    stubFetch(async () => {
      throw abortError;
    });
    const client = createGeminiClient({ apiKey: "k", maxRetries: 0 });

    await expect(client.generateContent("prompt")).rejects.toMatchObject({
      code: "timeout",
    });
  });

  it("clasifica HTTP 429 como rate_limited", async () => {
    stubFetch(async () => httpResponse("rate limit alcanzado", 429));
    const client = createGeminiClient({ apiKey: "k", maxRetries: 0 });

    await expect(client.generateContent("prompt")).rejects.toMatchObject({
      code: "rate_limited",
    });
  });

  it("clasifica RESOURCE_EXHAUSTED como quota_exceeded", async () => {
    stubFetch(async () => httpResponse('{"error":"RESOURCE_EXHAUSTED"}', 429));
    const client = createGeminiClient({ apiKey: "k", maxRetries: 0 });

    await expect(client.generateContent("prompt")).rejects.toMatchObject({
      code: "quota_exceeded",
    });
  });

  it("reintenta HTTP 5xx y termina en http_5xx", async () => {
    const fetchMock = stubFetch(async () => httpResponse("boom", 500));
    const client = createGeminiClient({ apiKey: "k", maxRetries: 1 });

    await expect(client.generateContent("prompt")).rejects.toMatchObject({
      code: "http_5xx",
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("reintenta un fallo de red y termina en network", async () => {
    const fetchMock = stubFetch(async () => {
      throw new Error("socket closed");
    });
    const client = createGeminiClient({ apiKey: "k", maxRetries: 1 });

    await expect(client.generateContent("prompt")).rejects.toMatchObject({
      code: "network",
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("clasifica una respuesta sin candidatos como invalid_response", async () => {
    stubFetch(async () => httpResponse({ candidates: [] }));
    const client = createGeminiClient({ apiKey: "k", maxRetries: 0 });

    await expect(client.generateContent("prompt")).rejects.toMatchObject({
      code: "invalid_response",
    });
  });

  it("clasifica un texto de candidato no-JSON como invalid_response", async () => {
    stubFetch(async () => httpResponse(candidate("esto no es JSON")));
    const client = createGeminiClient({ apiKey: "k", maxRetries: 0 });

    await expect(client.generateContent("prompt")).rejects.toMatchObject({
      code: "invalid_response",
    });
  });
});
