export type ApiConfig = {
  host: string;
  port: number;
  databaseUrl: string;
  allowedOrigins: ReadonlySet<string>;
  modelPurpose: string;
  modelGatewayUrl: string | null;
  modelGatewayToken: string | null;
  directModel: {
    baseUrl: string;
    apiKey: string;
    modelId: string;
  } | null;
  modelTimeoutMs: number;
};

const required = (env: NodeJS.ProcessEnv, name: string): string => {
  const value = String(env[name] ?? "").trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

const optional = (env: NodeJS.ProcessEnv, name: string): string | null => {
  const value = String(env[name] ?? "").trim();
  return value || null;
};

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ApiConfig {
  const gatewayUrl = optional(env, "ONESHOW_HOME_MODEL_GATEWAY_URL");
  const gatewayToken = optional(env, "ONESHOW_HOME_MODEL_GATEWAY_TOKEN");
  if (Boolean(gatewayUrl) !== Boolean(gatewayToken)) {
    throw new Error("Model gateway URL and token must be configured together");
  }

  const directBaseUrl = optional(env, "ONESHOW_HOME_CHAT_BASE_URL");
  const directApiKey = optional(env, "ONESHOW_HOME_CHAT_API_KEY");
  const directModelId = optional(env, "ONESHOW_HOME_CHAT_MODEL");
  const directParts = [directBaseUrl, directApiKey, directModelId].filter(Boolean).length;
  if (directParts !== 0 && directParts !== 3) {
    throw new Error("Direct model base URL, API key and model ID must be configured together");
  }
  if (!gatewayUrl && directParts === 0) throw new Error("No server-side model provider is configured");

  const port = Number(env.ONESHOW_HOME_API_PORT ?? 8793);
  const timeout = Number(env.ONESHOW_HOME_MODEL_TIMEOUT_MS ?? 45_000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid API port");

  return {
    host: String(env.ONESHOW_HOME_API_HOST ?? "127.0.0.1"),
    port,
    databaseUrl: required(env, "ONESHOW_HOME_DATABASE_URL"),
    allowedOrigins: new Set(
      String(env.ONESHOW_HOME_ALLOWED_ORIGINS ?? "tauri://localhost,http://tauri.localhost,http://127.0.0.1:1420")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    ),
    modelPurpose: String(env.ONESHOW_HOME_MODEL_PURPOSE ?? "oneshow_home_chat"),
    modelGatewayUrl: gatewayUrl,
    modelGatewayToken: gatewayToken,
    directModel: directParts === 3
      ? { baseUrl: directBaseUrl!, apiKey: directApiKey!, modelId: directModelId! }
      : null,
    modelTimeoutMs: Math.min(120_000, Math.max(5_000, Number.isFinite(timeout) ? timeout : 45_000)),
  };
}
