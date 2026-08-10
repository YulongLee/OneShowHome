import type { ApiConfig } from "./config.js";
import type { ChatMessage, ModelProvider, ModelResult } from "./types.js";

type OpenAiCompatibleResponse = {
  model?: string;
  choices?: Array<{ message?: { content?: unknown } }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
};

const providerError = (code: string, status = 502) => Object.assign(new Error(code), { code, status });

const responseText = (payload: OpenAiCompatibleResponse): string => {
  const content = payload.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) throw providerError("MODEL_INVALID_RESPONSE");
  return content.trim();
};

async function fetchJson(
  url: string,
  init: RequestInit,
  signal: AbortSignal,
  timeoutMs: number,
): Promise<{ payload: unknown; response: Response }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  signal.addEventListener("abort", () => controller.abort(), { once: true });
  try {
    const response = await fetch(url, { ...init, signal: controller.signal, redirect: "manual" });
    if (response.status >= 300 && response.status < 400) throw providerError("MODEL_REDIRECT_BLOCKED");
    const raw = await response.text();
    if (Buffer.byteLength(raw) > 2 * 1024 * 1024) throw providerError("MODEL_RESPONSE_TOO_LARGE");
    let payload: unknown = {};
    try { payload = raw ? JSON.parse(raw) : {}; } catch { throw providerError("MODEL_INVALID_RESPONSE"); }
    return { payload, response };
  } catch (error) {
    if ((error as Error).name === "AbortError") throw providerError("MODEL_TIMEOUT", 504);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

const mapUpstreamFailure = (status: number): never => {
  if (status === 429) throw providerError("MODEL_RATE_LIMITED", 429);
  if (status === 401 || status === 403) throw providerError("MODEL_AUTH_FAILED", 502);
  if (status === 400 || status === 404 || status === 422) throw providerError("MODEL_CONFIGURATION_INVALID", 502);
  throw providerError("MODEL_UPSTREAM_UNAVAILABLE", 502);
};

export class AdminGatewayModelProvider implements ModelProvider {
  constructor(
    private readonly url: string,
    private readonly token: string,
    private readonly timeoutMs: number,
  ) {}

  async chat(input: { purpose: string; instruction: string; messages: ChatMessage[]; signal: AbortSignal }): Promise<ModelResult> {
    const { payload, response } = await fetchJson(this.url, {
      method: "POST",
      headers: {
        authorization: `Bearer ${this.token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        purpose: input.purpose,
        instruction: input.instruction,
        messages: input.messages,
      }),
    }, input.signal, this.timeoutMs);
    if (!response.ok) mapUpstreamFailure(response.status);
    const result = payload as Partial<ModelResult>;
    if (typeof result.text !== "string" || !result.text.trim()) throw providerError("MODEL_INVALID_RESPONSE");
    return {
      text: result.text.trim(),
      modelId: typeof result.modelId === "string" ? result.modelId : null,
      inputTokens: typeof result.inputTokens === "number" ? result.inputTokens : null,
      outputTokens: typeof result.outputTokens === "number" ? result.outputTokens : null,
    };
  }
}

export class DirectModelProvider implements ModelProvider {
  constructor(
    private readonly config: NonNullable<ApiConfig["directModel"]>,
    private readonly timeoutMs: number,
  ) {}

  async chat(input: { purpose: string; instruction: string; messages: ChatMessage[]; signal: AbortSignal }): Promise<ModelResult> {
    const endpoint = `${this.config.baseUrl.replace(/\/+$/, "")}/chat/completions`;
    const { payload, response } = await fetchJson(endpoint, {
      method: "POST",
      headers: {
        authorization: `Bearer ${this.config.apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: this.config.modelId,
        messages: [{ role: "system", content: input.instruction }, ...input.messages],
      }),
    }, input.signal, this.timeoutMs);
    if (!response.ok) mapUpstreamFailure(response.status);
    const result = payload as OpenAiCompatibleResponse;
    return {
      text: responseText(result),
      modelId: result.model ?? this.config.modelId,
      inputTokens: result.usage?.prompt_tokens ?? null,
      outputTokens: result.usage?.completion_tokens ?? null,
    };
  }
}

export function createModelProvider(config: ApiConfig): ModelProvider {
  if (config.modelGatewayUrl && config.modelGatewayToken) {
    return new AdminGatewayModelProvider(config.modelGatewayUrl, config.modelGatewayToken, config.modelTimeoutMs);
  }
  if (config.directModel) return new DirectModelProvider(config.directModel, config.modelTimeoutMs);
  throw new Error("No model provider configured");
}

export const modelResponseText = responseText;
