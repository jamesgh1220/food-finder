/**
 * Cliente HTTP de Gemini (spec 09, REQ-03).
 *
 * Responsabilidades: construir la URL/endpoint, enviar la API key, aplicar
 * timeout con `AbortController`, reintentar SOLO cuando tiene sentido
 * (429/5xx/fallos de red) con backoff exponencial, clasificar errores en un
 * `GeminiClientError` tipado y parsear la salida estructurada.
 *
 * No usa el SDK `@google/genai` (no está instalado y la spec prohíbe nuevas
 * dependencias): habla con la API REST usando el `fetch` nativo.
 *
 * La API key es de servidor (REQ-04). Si llega vacía/ausente el cliente se
 * construye igual (no lanza); quien decide degradar es el proveedor, que evita
 * la llamada de red cuando no hay key.
 */

/**
 * Modelo por defecto de Gemini.
 *
 * Verificado 2026-10-09 contra la documentación oficial:
 * ai.google.dev/gemini-api/docs/models y /structured-output. `gemini-3.5-flash-lite`
 * es la recomendación vigente para proyectos nuevos (familia Flash-Lite con capa
 * gratuita, ~1.000 requests/día). `GEMINI_MODEL` lo sobrescribe vía el proveedor.
 */
export const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash-lite";

/** Base URL del endpoint v1beta de la API REST de Gemini. */
export const DEFAULT_GEMINI_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta";

/** Timeout por defecto de cada intento HTTP, en milisegundos. */
export const DEFAULT_GEMINI_TIMEOUT_MS = 15_000;

/** Número de reintentos por defecto (además del intento inicial). */
export const DEFAULT_GEMINI_MAX_RETRIES = 2;

/** Códigos de error clasificados del cliente (REQ-03/REQ-08). */
export const GEMINI_CLIENT_ERROR_CODES = [
  "rate_limited",
  "quota_exceeded",
  "timeout",
  "http_5xx",
  "invalid_response",
  "network",
] as const;

export type GeminiClientErrorCode = (typeof GEMINI_CLIENT_ERROR_CODES)[number];

/**
 * Error tipado del cliente Gemini.
 *
 * Nunca debe llegar al usuario final: el proveedor lo captura y lo convierte
 * en una lista vacía (REQ-08). El `context` conserva status/intento para
 * diagnóstico interno.
 */
export class GeminiClientError extends Error {
  readonly code: GeminiClientErrorCode;
  readonly context: Record<string, unknown>;

  constructor(
    code: GeminiClientErrorCode,
    message: string,
    context: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "GeminiClientError";
    this.code = code;
    this.context = context;
  }
}

/** Opciones de construcción del cliente Gemini. */
export interface GeminiClientOptions {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  timeoutMs?: number;
  maxRetries?: number;
}

/** Contrato mínimo del cliente: una sola operación de generación. */
export interface GeminiClient {
  generateContent(
    prompt: string,
    responseSchema?: Record<string, unknown>,
  ): Promise<unknown>;
}

/** Backoff exponencial corto: 250ms, 500ms, 1s… */
function backoffMs(attempt: number): number {
  return 250 * 2 ** attempt;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/** Detecta un abort de timeout de forma tolerante al entorno. */
function isAbortError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { name?: string }).name === "AbortError"
  );
}

/** Traduce el status HTTP no exitoso a un código clasificado. */
function classifyHttpError(
  status: number,
  bodyText: string,
  attempt: number,
): GeminiClientError {
  if (status === 429) {
    const quota = bodyText.includes("RESOURCE_EXHAUSTED");
    return new GeminiClientError(
      quota ? "quota_exceeded" : "rate_limited",
      quota
        ? "Gemini agotó la cuota disponible (RESOURCE_EXHAUSTED)."
        : "Gemini aplicó rate limiting (HTTP 429).",
      { status, attempt },
    );
  }
  if (status >= 500) {
    return new GeminiClientError(
      "http_5xx",
      `Gemini respondió con un error de servidor (HTTP ${status}).`,
      { status, attempt },
    );
  }
  return new GeminiClientError(
    "invalid_response",
    `Gemini respondió con un error no clasificado (HTTP ${status}).`,
    { status, attempt },
  );
}

/** Solo 429 (rate limit), 5xx y fallos de red merecen reintento. */
function isRetryable(code: GeminiClientErrorCode): boolean {
  return code === "rate_limited" || code === "http_5xx" || code === "network";
}

/** Extrae el texto generado de la forma `candidates[0].content.parts[0].text`. */
function extractCandidateText(payload: unknown): string | null {
  if (typeof payload !== "object" || payload === null) {
    return null;
  }
  const candidates = (payload as { candidates?: unknown }).candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return null;
  }
  const parts = (candidates[0] as { content?: { parts?: unknown } } | null)
    ?.content?.parts;
  if (!Array.isArray(parts) || parts.length === 0) {
    return null;
  }
  const text = (parts[0] as { text?: unknown } | null)?.text;
  return typeof text === "string" && text.length > 0 ? text : null;
}

/** Lee el cuerpo como texto sin dejar que un fallo de lectura rompa el flujo. */
async function safeText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return "";
  }
}

/**
 * Crea el cliente de Gemini.
 *
 * No lanza si falta la API key: se construye igual y el proveedor decide la
 * degradación elegante (REQ-08).
 */
export function createGeminiClient(
  options: GeminiClientOptions = {},
): GeminiClient {
  const apiKey = options.apiKey?.trim() ?? "";
  const baseUrl = (options.baseUrl ?? DEFAULT_GEMINI_BASE_URL).replace(
    /\/+$/,
    "",
  );
  const model = options.model ?? DEFAULT_GEMINI_MODEL;
  const timeoutMs = options.timeoutMs ?? DEFAULT_GEMINI_TIMEOUT_MS;
  const maxRetries = Math.max(
    0,
    options.maxRetries ?? DEFAULT_GEMINI_MAX_RETRIES,
  );

  async function performRequest(
    prompt: string,
    responseSchema: Record<string, unknown> | undefined,
    attempt: number,
  ): Promise<unknown> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const url = `${baseUrl}/models/${model}:generateContent`;
    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        ...(responseSchema ? { responseSchema } : {}),
      },
    };

    try {
      let response: Response;
      try {
        response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
      } catch (error) {
        if (isAbortError(error)) {
          throw new GeminiClientError(
            "timeout",
            "La llamada a Gemini superó el tiempo límite.",
            { attempt, timeoutMs },
          );
        }
        throw new GeminiClientError(
          "network",
          "No se pudo conectar con Gemini.",
          { attempt },
        );
      }

      if (!response.ok) {
        throw classifyHttpError(
          response.status,
          await safeText(response),
          attempt,
        );
      }

      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        throw new GeminiClientError(
          "invalid_response",
          "La respuesta de Gemini no es JSON válido.",
          { attempt, status: response.status },
        );
      }

      const text = extractCandidateText(payload);
      if (text === null) {
        throw new GeminiClientError(
          "invalid_response",
          "La respuesta de Gemini no contiene texto generado.",
          { attempt, status: response.status },
        );
      }

      try {
        return JSON.parse(text) as unknown;
      } catch {
        throw new GeminiClientError(
          "invalid_response",
          "El contenido generado por Gemini no es JSON válido.",
          { attempt, status: response.status },
        );
      }
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    async generateContent(prompt, responseSchema) {
      let lastError: GeminiClientError = new GeminiClientError(
        "network",
        "No se pudo conectar con Gemini.",
        {},
      );

      for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
        try {
          return await performRequest(prompt, responseSchema, attempt);
        } catch (error) {
          lastError =
            error instanceof GeminiClientError
              ? error
              : new GeminiClientError(
                  "invalid_response",
                  "Error inesperado al llamar a Gemini.",
                  { attempt },
                );
          if (!isRetryable(lastError.code) || attempt === maxRetries) {
            throw lastError;
          }
          await sleep(backoffMs(attempt));
        }
      }

      throw lastError;
    },
  };
}
