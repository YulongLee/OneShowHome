import { invoke } from "@tauri-apps/api/core";

const apiBaseUrl = String(
  import.meta.env.VITE_ONESHOW_HOME_API_BASE_URL ??
    "https://oneshowhome.com/api",
).replace(/\/+$/, "");
const conversationKey = "oneshow-home.conversation-id";

type InstallationCredential = {
  token: string;
};

type RegistrationResponse = {
  token: string;
};

type ChatResponse = {
  conversationId: string;
  reply: string;
};

const request = async <T>(
  path: string,
  init: RequestInit = {},
  token?: string,
): Promise<T> => {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as {
      error?: { code?: string };
    };
    throw Object.assign(
      new Error(payload.error?.code ?? "BACKEND_UNAVAILABLE"),
      {
        status: response.status,
      },
    );
  }
  return (await response.json()) as T;
};

const loadCredential = async (): Promise<InstallationCredential | null> => {
  return invoke<InstallationCredential | null>("load_installation_credential");
};

const registerInstallation = async (): Promise<InstallationCredential> => {
  const registration = await request<RegistrationResponse>(
    "/v1/installations",
    {
      method: "POST",
      body: JSON.stringify({
        platform: "macos",
        appVersion: "0.1.0",
        locale: navigator.language || "zh-CN",
      }),
    },
  );
  const credential = { token: registration.token };
  await invoke("save_installation_credential", { credential });
  return credential;
};

const ensureCredential = async (): Promise<InstallationCredential> => {
  const existing = await loadCredential();
  if (!existing) return registerInstallation();
  try {
    await request("/v1/me", { method: "GET" }, existing.token);
    return existing;
  } catch (error) {
    if ((error as { status?: number }).status === 401)
      return registerInstallation();
    throw error;
  }
};

export async function sendBuddyMessage(message: string): Promise<string> {
  const credential = await ensureCredential();
  const conversationId = window.localStorage.getItem(conversationKey);
  const response = await request<ChatResponse>(
    "/v1/chat",
    {
      method: "POST",
      body: JSON.stringify({ message, conversationId }),
    },
    credential.token,
  );
  window.localStorage.setItem(conversationKey, response.conversationId);
  return response.reply;
}
