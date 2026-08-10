import { Heart, House, Sparkle } from "@phosphor-icons/react";
import { useState, type FormEvent } from "react";
import buddyAvatar from "../../assets/house/buddy-avatar.png";
import {
  createDesktopBuddy,
  type BuddyProfile,
  type DesktopSnapshot,
} from "../../services/desktop-store";

const avatars: Array<{ id: BuddyProfile["avatarId"]; label: string }> = [
  { id: "milo", label: "Milo" },
  { id: "sora", label: "Sora" },
  { id: "mugi", label: "Mugi" },
];

const personalities: Array<{
  id: BuddyProfile["personality"];
  label: string;
  note: string;
}> = [
  { id: "warm", label: "温柔", note: "安静倾听，给你温暖回应" },
  { id: "lively", label: "活泼", note: "好奇热情，喜欢分享小惊喜" },
  { id: "quiet", label: "沉静", note: "克制细腻，陪你慢慢生活" },
];

export function BuddyOnboarding({
  onCreated,
}: {
  onCreated: (snapshot: DesktopSnapshot) => void;
}) {
  const [name, setName] = useState("Milo");
  const [avatarId, setAvatarId] = useState<BuddyProfile["avatarId"]>("milo");
  const [personality, setPersonality] =
    useState<BuddyProfile["personality"]>("warm");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      onCreated(await createDesktopBuddy(name, avatarId, personality));
    } catch (reason) {
      setError(
        typeof reason === "string" ? reason : "小屋暂时无法创建，请再试一次。 ",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="onboarding-shell">
      <section className="onboarding-card">
        <div className="onboarding-story">
          <span className="onboarding-mark">
            <House weight="fill" />
          </span>
          <small>ONESHOW HOME</small>
          <h1>欢迎回家。</h1>
          <p>从今天起，会有一个小小的数字生命住在这台 Mac 里，陪你慢慢生活。</p>
          <div className="onboarding-preview">
            <img
              alt="Buddy 预览"
              className={`avatar-${avatarId}`}
              src={buddyAvatar}
            />
            <span>
              <Heart weight="fill" /> 等你为它取一个名字
            </span>
          </div>
        </div>

        <form className="onboarding-form" onSubmit={submit}>
          <header>
            <Sparkle weight="fill" />
            <div>
              <small>第一次见面</small>
              <h2>创建你的 Buddy</h2>
            </div>
          </header>
          <label>
            它叫什么名字？
            <input
              maxLength={20}
              onChange={(event) => setName(event.target.value)}
              value={name}
            />
          </label>
          <fieldset>
            <legend>选择形象</legend>
            <div className="avatar-options">
              {avatars.map((avatar) => (
                <button
                  className={avatar.id === avatarId ? "is-selected" : ""}
                  key={avatar.id}
                  onClick={() => setAvatarId(avatar.id)}
                  type="button"
                >
                  <img
                    alt=""
                    className={`avatar-${avatar.id}`}
                    src={buddyAvatar}
                  />
                  <span>{avatar.label}</span>
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>选择性格</legend>
            <div className="personality-options">
              {personalities.map((item) => (
                <button
                  className={item.id === personality ? "is-selected" : ""}
                  key={item.id}
                  onClick={() => setPersonality(item.id)}
                  type="button"
                >
                  <strong>{item.label}</strong>
                  <small>{item.note}</small>
                </button>
              ))}
            </div>
          </fieldset>
          {error ? (
            <p className="form-error" role="alert">
              {error}
            </p>
          ) : null}
          <button
            className="primary-action"
            disabled={saving || !name.trim()}
            type="submit"
          >
            {saving ? "正在布置小屋…" : "住进 OneShow Home"}
          </button>
          <p className="privacy-note">
            资料默认保存在这台 Mac。记忆只会在你明确保存时记录。
          </p>
        </form>
      </section>
    </main>
  );
}
