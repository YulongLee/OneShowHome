import {
  Brain,
  BookOpenText,
  DownloadSimple,
  GearSix,
  Images,
  Plus,
  Power,
  Trash,
  X,
} from "@phosphor-icons/react";
import { useEffect, useState, type FormEvent } from "react";
import {
  addDesktopMemory,
  clearDesktopData,
  deleteDesktopDiary,
  deleteDesktopMemory,
  deleteGalleryPhoto,
  exportDesktopData,
  galleryPhotoUrl,
  generateDesktopDiary,
  importGalleryPhoto,
  quitDesktopApp,
  readAutostart,
  setDesktopSound,
  writeAutostart,
  type DesktopSnapshot,
} from "../../services/desktop-store";

export type HomeDialogKind = "diary" | "memory" | "gallery" | "settings";

const headings = {
  diary: {
    title: "Buddy 日记",
    note: "只记录真实发生在小屋里的日常",
    icon: BookOpenText,
  },
  memory: {
    title: "共同记忆",
    note: "只有你主动保存，Buddy 才会记住",
    icon: Brain,
  },
  gallery: {
    title: "小屋相册",
    note: "把喜欢的照片留在这台 Mac",
    icon: Images,
  },
  settings: {
    title: "小屋设置",
    note: "管理桌面体验与本地资料",
    icon: GearSix,
  },
} as const;

export function HomeDialog({
  kind,
  snapshot,
  onClose,
  onSnapshot,
  onOpenModelSettings,
  onReset,
}: {
  kind: HomeDialogKind;
  snapshot: DesktopSnapshot;
  onClose: () => void;
  onSnapshot: (snapshot: DesktopSnapshot) => void;
  onOpenModelSettings: () => void;
  onReset: () => void;
}) {
  const config = headings[kind];
  const Icon = config.icon;
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [memory, setMemory] = useState("");
  const [memoryType, setMemoryType] = useState<"preference" | "event">(
    "preference",
  );
  const [autostart, setAutostart] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    if (kind === "settings")
      void readAutostart()
        .then(setAutostart)
        .catch(() => undefined);
  }, [kind]);

  const run = async (
    operation: () => Promise<DesktopSnapshot | null>,
    success?: string,
  ) => {
    setBusy(true);
    setMessage(null);
    try {
      const next = await operation();
      if (next) onSnapshot(next);
      if (success) setMessage(success);
    } catch (reason) {
      setMessage(
        typeof reason === "string" ? reason : "刚才没有完成，请再试一次。 ",
      );
    } finally {
      setBusy(false);
    }
  };

  const submitMemory = (event: FormEvent) => {
    event.preventDefault();
    if (!memory.trim()) return;
    void run(
      () => addDesktopMemory(memoryType, memory),
      "已经好好记住了。",
    ).then(() => setMemory(""));
  };

  return (
    <div
      className="settings-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        aria-label={config.title}
        aria-modal="true"
        className="feature-dialog"
        role="dialog"
      >
        <header>
          <span>
            <Icon weight="fill" />
          </span>
          <div>
            <small>ONESHOW HOME</small>
            <h2>{config.title}</h2>
            <p>{config.note}</p>
          </div>
          <button aria-label="关闭" onClick={onClose} type="button">
            <X />
          </button>
        </header>

        {kind === "diary" ? (
          <div className="dialog-content">
            <button
              className="soft-action"
              disabled={busy}
              onClick={() =>
                void run(generateDesktopDiary, "今天的日记写好了。 ")
              }
              type="button"
            >
              <Plus /> 写下今天
            </button>
            <div className="entry-list">
              {snapshot.diaries.length ? (
                snapshot.diaries.map((entry) => (
                  <article key={entry.id}>
                    <time>{entry.localDate}</time>
                    <p>{entry.content}</p>
                    <button
                      aria-label={`删除 ${entry.localDate} 的日记`}
                      onClick={() =>
                        void run(() => deleteDesktopDiary(entry.id))
                      }
                      type="button"
                    >
                      <Trash />
                    </button>
                  </article>
                ))
              ) : (
                <EmptyState text="今天还没有留下日记。和 Buddy 互动后再来看看吧。" />
              )}
            </div>
          </div>
        ) : null}

        {kind === "memory" ? (
          <div className="dialog-content">
            <form className="memory-form" onSubmit={submitMemory}>
              <div className="memory-type">
                <button
                  className={memoryType === "preference" ? "is-selected" : ""}
                  onClick={() => setMemoryType("preference")}
                  type="button"
                >
                  我的偏好
                </button>
                <button
                  className={memoryType === "event" ? "is-selected" : ""}
                  onClick={() => setMemoryType("event")}
                  type="button"
                >
                  共同经历
                </button>
              </div>
              <textarea
                maxLength={400}
                onChange={(event) => setMemory(event.target.value)}
                placeholder="例如：我喜欢雨天，也喜欢睡前听轻音乐。"
                value={memory}
              />
              <button
                className="soft-action"
                disabled={busy || !memory.trim()}
                type="submit"
              >
                <Plus /> 保存这条记忆
              </button>
            </form>
            <div className="entry-list compact">
              {snapshot.memories.length ? (
                snapshot.memories.map((entry) => (
                  <article key={entry.id}>
                    <time>
                      {entry.memoryType === "preference" ? "偏好" : "经历"}
                    </time>
                    <p>{entry.content}</p>
                    <button
                      aria-label="删除记忆"
                      onClick={() =>
                        void run(() => deleteDesktopMemory(entry.id))
                      }
                      type="button"
                    >
                      <Trash />
                    </button>
                  </article>
                ))
              ) : (
                <EmptyState text="还没有保存记忆。Buddy 不会在你不知情时偷偷记录。" />
              )}
            </div>
          </div>
        ) : null}

        {kind === "gallery" ? (
          <div className="dialog-content">
            <button
              className="soft-action"
              disabled={busy}
              onClick={() =>
                void run(importGalleryPhoto, "照片已经放进小屋相册。 ")
              }
              type="button"
            >
              <Plus /> 添加照片
            </button>
            {snapshot.gallery.length ? (
              <div className="gallery-grid">
                {snapshot.gallery.map((photo) => (
                  <figure key={photo.id}>
                    <img alt="小屋相册照片" src={galleryPhotoUrl(photo.path)} />
                    <button
                      aria-label="移除照片"
                      onClick={() =>
                        void run(() => deleteGalleryPhoto(photo.id))
                      }
                      type="button"
                    >
                      <Trash />
                    </button>
                  </figure>
                ))}
              </div>
            ) : (
              <EmptyState text="相册还是空的。可以从 Mac 里选择一张喜欢的照片。" />
            )}
          </div>
        ) : null}

        {kind === "settings" ? (
          <div className="dialog-content settings-list">
            <SettingRow label="声音" note="保留小屋互动音效开关">
              <Toggle
                checked={snapshot.settings.soundEnabled}
                onChange={(value) => void run(() => setDesktopSound(value))}
              />
            </SettingRow>
            <SettingRow
              label="开机后出现"
              note="登录 Mac 后自动打开 OneShow Home"
            >
              <Toggle
                checked={autostart}
                onChange={(value) => {
                  setAutostart(value);
                  void writeAutostart(value).catch(() => {
                    setAutostart(!value);
                    setMessage("无法更新开机启动设置。 ");
                  });
                }}
              />
            </SettingRow>
            <SettingRow
              label="Buddy 的大脑"
              note="选择官方服务或这台 Mac 的本地模型"
            >
              <button
                className="text-action"
                onClick={onOpenModelSettings}
                type="button"
              >
                配置模型
              </button>
            </SettingRow>
            <SettingRow label="导出资料" note="生成一份可阅读的 JSON 备份">
              <button
                className="text-action"
                onClick={() =>
                  void exportDesktopData()
                    .then((done) => done && setMessage("备份已经导出。 "))
                    .catch(() => setMessage("导出失败，请再试一次。 "))
                }
                type="button"
              >
                <DownloadSimple /> 导出
              </button>
            </SettingRow>
            <SettingRow
              label="清空并重新开始"
              note="删除 Buddy、记忆、日记、相册与会话"
            >
              <button
                className="text-action danger"
                onClick={() => setConfirmReset(true)}
                type="button"
              >
                <Trash /> 清空
              </button>
            </SettingRow>
            <SettingRow label="OneShow Home" note="版本 0.1.0 · 本地桌面 MVP">
              <button
                className="text-action"
                onClick={() => void quitDesktopApp()}
                type="button"
              >
                <Power /> 退出应用
              </button>
            </SettingRow>
            {confirmReset ? (
              <div className="reset-confirm">
                <p>这会永久删除这台 Mac 上的 OneShow Home 资料，且无法撤销。</p>
                <button onClick={() => setConfirmReset(false)} type="button">
                  取消
                </button>
                <button
                  className="danger-fill"
                  onClick={() =>
                    void clearDesktopData().then(() => {
                      window.localStorage.clear();
                      onReset();
                    })
                  }
                  type="button"
                >
                  确认全部删除
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        {message ? (
          <p className="dialog-message" role="status">
            {message}
          </p>
        ) : null}
      </section>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="empty-state">
      <p>{text}</p>
    </div>
  );
}

function SettingRow({
  label,
  note,
  children,
}: {
  label: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <div className="setting-row">
      <div>
        <strong>{label}</strong>
        <small>{note}</small>
      </div>
      {children}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      aria-checked={checked}
      aria-label="切换设置"
      className={`toggle${checked ? " is-on" : ""}`}
      onClick={() => onChange(!checked)}
      role="switch"
      type="button"
    >
      <span />
    </button>
  );
}
