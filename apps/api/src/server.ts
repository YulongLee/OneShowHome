import { createHash, randomBytes } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { ApiConfig } from "./config.js";
import { buddyInstruction, trimConversation } from "./buddy.js";
import type { Installation, ModelProvider, Repository } from "./types.js";

type ApiDependencies = {
  config: ApiConfig;
  repository: Repository;
  modelProvider: ModelProvider;
};

type HttpError = Error & { code: string; status: number };
const httpError = (code: string, status: number): HttpError => Object.assign(new Error(code), { code, status });
const tokenHash = (token: string): string => createHash("sha256").update(token).digest("hex");

const json = (response: ServerResponse, status: number, body: unknown): void => {
  response.statusCode = status;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.setHeader("cache-control", "no-store");
  response.setHeader("x-content-type-options", "nosniff");
  response.end(JSON.stringify(body));
};

async function readJson(request: IncomingMessage, maximumBytes = 32 * 1024): Promise<Record<string, unknown>> {
  const declared = Number(request.headers["content-length"] ?? 0);
  if (declared > maximumBytes) throw httpError("REQUEST_TOO_LARGE", 413);
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.byteLength;
    if (size > maximumBytes) throw httpError("REQUEST_TOO_LARGE", 413);
    chunks.push(buffer);
  }
  try {
    return chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) as Record<string, unknown> : {};
  } catch {
    throw httpError("INVALID_JSON", 400);
  }
}

const cleanString = (value: unknown, maximum: number, required = false): string | null => {
  const result = typeof value === "string" ? value.trim() : "";
  if (required && !result) throw httpError("INVALID_INPUT", 400);
  if (result.length > maximum) throw httpError("INVALID_INPUT", 400);
  return result || null;
};

class SlidingWindowRateLimiter {
  readonly #entries = new Map<string, number[]>();

  allow(key: string, maximum: number, windowMs: number): boolean {
    const now = Date.now();
    const recent = (this.#entries.get(key) ?? []).filter((timestamp) => timestamp > now - windowMs);
    if (recent.length >= maximum) return false;
    recent.push(now);
    this.#entries.set(key, recent);
    if (this.#entries.size > 10_000) {
      for (const [entryKey, timestamps] of this.#entries) {
        if (!timestamps.some((timestamp) => timestamp > now - windowMs)) this.#entries.delete(entryKey);
      }
    }
    return true;
  }
}

const remoteIdentity = (request: IncomingMessage): string => {
  const forwarded = String(request.headers["x-real-ip"] ?? "").trim();
  return forwarded || request.socket.remoteAddress || "unknown";
};

async function authenticatedInstallation(request: IncomingMessage, repository: Repository): Promise<Installation> {
  const authorization = String(request.headers.authorization ?? "");
  const match = authorization.match(/^Bearer\s+([A-Za-z0-9_-]{40,})$/);
  if (!match?.[1]) throw httpError("UNAUTHENTICATED", 401);
  const installation = await repository.findInstallationByTokenHash(tokenHash(match[1]));
  if (!installation) throw httpError("UNAUTHENTICATED", 401);
  return installation;
}

function applyCors(request: IncomingMessage, response: ServerResponse, config: ApiConfig): void {
  const origin = String(request.headers.origin ?? "");
  if (origin && config.allowedOrigins.has(origin)) {
    response.setHeader("access-control-allow-origin", origin);
    response.setHeader("vary", "origin");
    response.setHeader("access-control-allow-headers", "authorization, content-type");
    response.setHeader("access-control-allow-methods", "GET, POST, PATCH, PUT, OPTIONS");
  }
}

export function createApiServer({ config, repository, modelProvider }: ApiDependencies) {
  const limiter = new SlidingWindowRateLimiter();
  const conversationLocks = new Map<string, Promise<void>>();

  const withConversationLock = async <T>(conversationId: string, action: () => Promise<T>): Promise<T> => {
    const previous = conversationLocks.get(conversationId) ?? Promise.resolve();
    let release: () => void = () => {};
    const current = new Promise<void>((resolve) => { release = resolve; });
    const queued = previous.then(() => current);
    conversationLocks.set(conversationId, queued);
    await previous;
    try { return await action(); }
    finally {
      release();
      if (conversationLocks.get(conversationId) === queued) conversationLocks.delete(conversationId);
    }
  };

  return createServer(async (request, response) => {
    applyCors(request, response, config);
    const requestId = String(request.headers["x-request-id"] ?? randomBytes(8).toString("hex")).slice(0, 80);
    response.setHeader("x-request-id", requestId);
    try {
      if (request.method === "OPTIONS") {
        response.statusCode = 204;
        return response.end();
      }
      const url = new URL(request.url ?? "/", "http://localhost");
      const path = url.pathname;

      if (path === "/health/live" && request.method === "GET") return json(response, 200, { status: "ok" });
      if (path === "/health/ready" && request.method === "GET") {
        await repository.ready();
        return json(response, 200, { status: "ready", modelPurpose: config.modelPurpose });
      }

      if (path === "/v1/installations" && request.method === "POST") {
        if (!limiter.allow(`register:${remoteIdentity(request)}`, 10, 60 * 60_000)) throw httpError("RATE_LIMITED", 429);
        const body = await readJson(request);
        const platform = cleanString(body.platform, 32, true)!;
        const appVersion = cleanString(body.appVersion, 32, true)!;
        const locale = cleanString(body.locale, 16) ?? "zh-CN";
        const deviceName = cleanString(body.deviceName, 120);
        if (!new Set(["macos"]).has(platform)) throw httpError("UNSUPPORTED_PLATFORM", 400);
        const token = randomBytes(32).toString("base64url");
        const installation = await repository.createInstallation({ platform, appVersion, locale, deviceName, tokenHash: tokenHash(token) });
        return json(response, 201, { installationId: installation.id, token, buddy: installation.buddy });
      }

      const installation = await authenticatedInstallation(request, repository);
      if (!limiter.allow(`api:${installation.id}`, 120, 60_000)) throw httpError("RATE_LIMITED", 429);

      if (path === "/v1/me" && request.method === "GET") {
        return json(response, 200, { installationId: installation.id, locale: installation.locale, buddy: installation.buddy });
      }

      if (path === "/v1/buddy" && request.method === "PATCH") {
        const body = await readJson(request);
        const name = body.name === undefined ? undefined : cleanString(body.name, 40, true)!;
        const personality = body.personality === undefined ? undefined : cleanString(body.personality, 40, true)!;
        const avatarId = body.avatarId === undefined ? undefined : cleanString(body.avatarId, 80, true)!;
        const patch = {
          ...(name === undefined ? {} : { name }),
          ...(personality === undefined ? {} : { personality }),
          ...(avatarId === undefined ? {} : { avatarId }),
        };
        const buddy = await repository.updateBuddy(installation.id, patch);
        return json(response, 200, { buddy });
      }

      if (path === "/v1/chat" && request.method === "POST") {
        if (!limiter.allow(`chat:${installation.id}`, 20, 60_000)) throw httpError("CHAT_RATE_LIMITED", 429);
        const body = await readJson(request);
        const content = cleanString(body.message, 4_000, true)!;
        const requestedConversationId = cleanString(body.conversationId, 80);
        const conversationId = await repository.getOrCreateConversation(installation.id, requestedConversationId);
        const result = await withConversationLock(conversationId, async () => {
          await repository.appendMessage({ conversationId, role: "user", content });
          const history = trimConversation(await repository.recentMessages(installation.id, conversationId, 24));
          const controller = new AbortController();
          request.once("aborted", () => controller.abort());
          const model = await modelProvider.chat({
            purpose: config.modelPurpose,
            instruction: buddyInstruction(installation.buddy, installation.locale),
            messages: history,
            signal: controller.signal,
          });
          await repository.appendMessage({
            conversationId,
            role: "assistant",
            content: model.text,
            modelPurpose: config.modelPurpose,
            modelId: model.modelId,
            inputTokens: model.inputTokens,
            outputTokens: model.outputTokens,
          });
          return model;
        });
        return json(response, 200, { conversationId, reply: result.text });
      }

      throw httpError("NOT_FOUND", 404);
    } catch (error) {
      const candidate = error as Partial<HttpError>;
      const known = typeof candidate.code === "string" && typeof candidate.status === "number";
      if (!known) console.error(JSON.stringify({ level: "error", requestId, code: "INTERNAL_ERROR", message: (error as Error).message }));
      json(response, known ? candidate.status! : 500, { error: { code: known ? candidate.code : "INTERNAL_ERROR", requestId } });
    }
  });
}
