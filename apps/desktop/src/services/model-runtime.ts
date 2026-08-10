import { invoke } from "@tauri-apps/api/core";
import { sendBuddyMessage as sendOfficialBuddyMessage } from "./backend";

export type ModelMode = "official" | "local";
export type LocalModelProvider = "ollama" | "lm-studio" | "custom";

export type ModelSettings = {
  mode: ModelMode;
  local: {
    provider: LocalModelProvider;
    baseUrl: string;
    modelId: string;
  };
};

type LocalMessage = { role: "user" | "assistant"; content: string };
type LocalModelTestResult = { modelId: string; latencyMs: number };
type LocalModelReply = { text: string; modelId: string };

const settingsKey = "oneshow-home.model-settings.v1";
const localHistoryKey = "oneshow-home.local-conversation.v1";

export const defaultModelSettings: ModelSettings = {
  mode: "official",
  local: {
    provider: "ollama",
    baseUrl: "http://127.0.0.1:11434/v1",
    modelId: "",
  },
};

export function loadModelSettings(): ModelSettings {
  try {
    const stored = JSON.parse(
      window.localStorage.getItem(settingsKey) ?? "null",
    ) as Partial<ModelSettings> | null;
    if (!stored || !["official", "local"].includes(stored.mode ?? "")) {
      return defaultModelSettings;
    }
    return {
      mode: stored.mode as ModelMode,
      local: {
        provider: ["ollama", "lm-studio", "custom"].includes(
          stored.local?.provider ?? "",
        )
          ? (stored.local!.provider as LocalModelProvider)
          : "ollama",
        baseUrl:
          typeof stored.local?.baseUrl === "string"
            ? stored.local.baseUrl
            : defaultModelSettings.local.baseUrl,
        modelId:
          typeof stored.local?.modelId === "string" ? stored.local.modelId : "",
      },
    };
  } catch {
    return defaultModelSettings;
  }
}

export function saveModelSettings(settings: ModelSettings): void {
  window.localStorage.setItem(settingsKey, JSON.stringify(settings));
}

export async function testLocalModel(
  settings: ModelSettings["local"],
): Promise<LocalModelTestResult> {
  return invoke<LocalModelTestResult>("test_local_model", {
    config: { baseUrl: settings.baseUrl, modelId: settings.modelId },
  });
}

const loadLocalHistory = (): LocalMessage[] => {
  try {
    const history = JSON.parse(
      window.localStorage.getItem(localHistoryKey) ?? "[]",
    ) as LocalMessage[];
    return Array.isArray(history)
      ? history
          .filter(
            (message) =>
              ["user", "assistant"].includes(message?.role) &&
              typeof message?.content === "string",
          )
          .slice(-24)
      : [];
  } catch {
    return [];
  }
};

const sendLocalBuddyMessage = async (
  message: string,
  settings: ModelSettings["local"],
): Promise<string> => {
  const history = [
    ...loadLocalHistory(),
    { role: "user" as const, content: message },
  ].slice(-24);
  const response = await invoke<LocalModelReply>("chat_local_model", {
    config: { baseUrl: settings.baseUrl, modelId: settings.modelId },
    messages: history,
  });
  window.localStorage.setItem(
    localHistoryKey,
    JSON.stringify(
      [
        ...history,
        { role: "assistant" as const, content: response.text },
      ].slice(-24),
    ),
  );
  return response.text;
};

export async function sendConfiguredBuddyMessage(message: string) {
  const settings = loadModelSettings();
  return settings.mode === "local"
    ? sendLocalBuddyMessage(message, settings.local)
    : sendOfficialBuddyMessage(message);
}

export function clearLocalConversation(): void {
  window.localStorage.removeItem(localHistoryKey);
}
