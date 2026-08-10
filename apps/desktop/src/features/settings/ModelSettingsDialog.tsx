import {
  CheckCircle,
  Cloud,
  Cpu,
  PlugsConnected,
  SpinnerGap,
  X,
} from "@phosphor-icons/react";
import { useState, type FormEvent } from "react";
import {
  clearLocalConversation,
  loadModelSettings,
  saveModelSettings,
  testLocalModel,
  type LocalModelProvider,
  type ModelSettings,
} from "../../services/model-runtime";

type Props = {
  onClose: () => void;
  onSaved: (settings: ModelSettings) => void;
};

const presets: Record<
  Exclude<LocalModelProvider, "custom">,
  { label: string; baseUrl: string; hint: string }
> = {
  ollama: {
    label: "Ollama",
    baseUrl: "http://127.0.0.1:11434/v1",
    hint: "先运行 ollama serve，并至少下载一个模型。",
  },
  "lm-studio": {
    label: "LM Studio",
    baseUrl: "http://127.0.0.1:1234/v1",
    hint: "在 Developer 页面加载模型并启动 Local Server。",
  },
};

export function ModelSettingsDialog({ onClose, onSaved }: Props) {
  const [draft, setDraft] = useState(loadModelSettings);
  const [testing, setTesting] = useState(false);
  const [testState, setTestState] = useState<
    | { kind: "healthy"; message: string }
    | { kind: "error"; message: string }
    | null
  >(null);

  const chooseProvider = (provider: LocalModelProvider) => {
    setDraft((current) => ({
      ...current,
      local: {
        ...current.local,
        provider,
        baseUrl:
          provider === "custom"
            ? current.local.baseUrl
            : presets[provider].baseUrl,
        modelId: "",
      },
    }));
    setTestState(null);
  };

  const testConnection = async () => {
    setTesting(true);
    setTestState(null);
    try {
      const result = await testLocalModel(draft.local);
      setDraft((current) => ({
        ...current,
        local: { ...current.local, modelId: result.modelId },
      }));
      setTestState({
        kind: "healthy",
        message: `已连接 ${result.modelId} · ${result.latencyMs}ms`,
      });
    } catch (error) {
      setTestState({
        kind: "error",
        message:
          typeof error === "string"
            ? error
            : error instanceof Error
              ? error.message
              : "没有检测到本地模型服务。",
      });
    } finally {
      setTesting(false);
    }
  };

  const save = (event: FormEvent) => {
    event.preventDefault();
    if (draft.mode === "local" && testState?.kind !== "healthy") {
      setTestState({ kind: "error", message: "请先测试本地模型连接。" });
      return;
    }
    saveModelSettings(draft);
    clearLocalConversation();
    onSaved(draft);
    onClose();
  };

  return (
    <div className="settings-backdrop" onMouseDown={onClose}>
      <section
        aria-label="Buddy 的大脑"
        aria-modal="true"
        className="model-settings"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <header>
          <div>
            <small>BUDDY MIND</small>
            <h2>Buddy 的大脑</h2>
            <p>选择官方陪伴服务，或让模型完全运行在这台 Mac 上。</p>
          </div>
          <button aria-label="关闭模型设置" onClick={onClose} type="button">
            <X />
          </button>
        </header>

        <form onSubmit={save}>
          <div className="model-mode-grid">
            <button
              className={draft.mode === "official" ? "is-selected" : ""}
              onClick={() => {
                setDraft({ ...draft, mode: "official" });
                setTestState(null);
              }}
              type="button"
            >
              <Cloud weight="fill" />
              <span>
                <strong>OneShow 官方模型</strong>
                <small>开箱即用，记忆保存在你的 Home 账户中</small>
              </span>
            </button>
            <button
              className={draft.mode === "local" ? "is-selected" : ""}
              onClick={() => {
                setDraft({ ...draft, mode: "local" });
                setTestState(null);
              }}
              type="button"
            >
              <Cpu weight="fill" />
              <span>
                <strong>这台 Mac 的本地模型</strong>
                <small>对话直接发往 localhost，不经过服务器</small>
              </span>
            </button>
          </div>

          {draft.mode === "local" ? (
            <div className="local-model-form">
              <div className="provider-tabs">
                {(["ollama", "lm-studio", "custom"] as const).map(
                  (provider) => (
                    <button
                      className={
                        draft.local.provider === provider ? "is-active" : ""
                      }
                      key={provider}
                      onClick={() => chooseProvider(provider)}
                      type="button"
                    >
                      {provider === "custom"
                        ? "自定义"
                        : presets[provider].label}
                    </button>
                  ),
                )}
              </div>
              <label>
                本地 API 地址
                <input
                  onChange={(event) => {
                    setDraft({
                      ...draft,
                      local: { ...draft.local, baseUrl: event.target.value },
                    });
                    setTestState(null);
                  }}
                  placeholder="http://127.0.0.1:11434/v1"
                  type="url"
                  value={draft.local.baseUrl}
                />
              </label>
              <label>
                模型 ID
                <input
                  onChange={(event) => {
                    setDraft({
                      ...draft,
                      local: { ...draft.local, modelId: event.target.value },
                    });
                    setTestState(null);
                  }}
                  placeholder="留空可自动选择已加载模型"
                  value={draft.local.modelId}
                />
              </label>
              <p className="provider-hint">
                {draft.local.provider === "custom"
                  ? "仅允许连接 127.0.0.1、localhost 或 ::1，并要求兼容 OpenAI /v1 接口。"
                  : presets[draft.local.provider].hint}
              </p>
              {testState ? (
                <p className={`model-test-state ${testState.kind}`}>
                  {testState.kind === "healthy" ? <CheckCircle /> : <X />}
                  {testState.message}
                </p>
              ) : null}
              <button
                className="test-model-button"
                disabled={testing}
                onClick={() => void testConnection()}
                type="button"
              >
                {testing ? <SpinnerGap className="spin" /> : <PlugsConnected />}
                {testing ? "正在连接…" : "测试本地模型"}
              </button>
            </div>
          ) : null}

          <footer>
            <button onClick={onClose} type="button">
              取消
            </button>
            <button className="save-model-button" type="submit">
              保存并使用
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
