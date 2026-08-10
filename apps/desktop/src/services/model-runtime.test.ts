import { invoke } from "@tauri-apps/api/core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sendBuddyMessage } from "./backend";
import {
  defaultModelSettings,
  loadModelSettings,
  saveModelSettings,
  sendConfiguredBuddyMessage,
  testLocalModel,
} from "./model-runtime";

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));
vi.mock("./backend", () => ({ sendBuddyMessage: vi.fn() }));

describe("model runtime", () => {
  const storage = new Map<string, string>();

  beforeEach(() => {
    storage.clear();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
        removeItem: (key: string) => storage.delete(key),
        clear: () => storage.clear(),
      },
    });
    vi.clearAllMocks();
  });

  it("uses the managed OneShow model by default", async () => {
    vi.mocked(sendBuddyMessage).mockResolvedValue("欢迎回家");

    expect(loadModelSettings()).toEqual(defaultModelSettings);
    await expect(sendConfiguredBuddyMessage("我回来了")).resolves.toBe(
      "欢迎回家",
    );
    expect(sendBuddyMessage).toHaveBeenCalledWith("我回来了");
    expect(invoke).not.toHaveBeenCalled();
  });

  it("tests and chats with a local model without calling the server", async () => {
    const settings = {
      mode: "local" as const,
      local: {
        provider: "ollama" as const,
        baseUrl: "http://127.0.0.1:11434/v1",
        modelId: "qwen3:8b",
      },
    };
    saveModelSettings(settings);
    vi.mocked(invoke)
      .mockResolvedValueOnce({ modelId: "qwen3:8b", latencyMs: 18 })
      .mockResolvedValueOnce({ modelId: "qwen3:8b", text: "我一直在家里。" });

    await expect(testLocalModel(settings.local)).resolves.toEqual({
      modelId: "qwen3:8b",
      latencyMs: 18,
    });
    await expect(sendConfiguredBuddyMessage("你在吗？")).resolves.toBe(
      "我一直在家里。",
    );

    expect(invoke).toHaveBeenNthCalledWith(1, "test_local_model", {
      config: {
        baseUrl: "http://127.0.0.1:11434/v1",
        modelId: "qwen3:8b",
      },
    });
    expect(invoke).toHaveBeenNthCalledWith(
      2,
      "chat_local_model",
      expect.objectContaining({
        messages: [{ role: "user", content: "你在吗？" }],
      }),
    );
    expect(sendBuddyMessage).not.toHaveBeenCalled();
  });
});
