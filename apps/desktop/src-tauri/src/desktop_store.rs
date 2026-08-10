use rusqlite::{params, Connection, OptionalExtension};
use serde::Serialize;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Mutex;

pub struct DesktopStore {
    connection: Mutex<Connection>,
    data_dir: PathBuf,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BuddyProfile {
    name: String,
    avatar_id: String,
    personality: String,
    created_at: i64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BuddyState {
    mood: String,
    energy: i64,
    location: String,
    activity: String,
    updated_at: i64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Memory {
    id: i64,
    memory_type: String,
    content: String,
    importance: i64,
    created_at: i64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Diary {
    id: i64,
    local_date: String,
    content: String,
    created_at: i64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GalleryPhoto {
    id: i64,
    path: String,
    created_at: i64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DesktopSettings {
    sound_enabled: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DesktopSnapshot {
    profile: Option<BuddyProfile>,
    state: Option<BuddyState>,
    memories: Vec<Memory>,
    diaries: Vec<Diary>,
    gallery: Vec<GalleryPhoto>,
    settings: DesktopSettings,
}

impl DesktopStore {
    pub fn open(data_dir: PathBuf) -> Result<Self, String> {
        fs::create_dir_all(&data_dir).map_err(|error| error.to_string())?;
        let connection = Connection::open(data_dir.join("oneshow-home.sqlite"))
            .map_err(|error| error.to_string())?;
        connection
            .execute_batch(
                "PRAGMA journal_mode=WAL;
                 PRAGMA foreign_keys=ON;
                 PRAGMA busy_timeout=5000;
                 CREATE TABLE IF NOT EXISTS buddy_profile (
                   id INTEGER PRIMARY KEY CHECK (id = 1),
                   name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 20),
                   avatar_id TEXT NOT NULL,
                   personality TEXT NOT NULL,
                   created_at INTEGER NOT NULL,
                   updated_at INTEGER NOT NULL
                 );
                 CREATE TABLE IF NOT EXISTS buddy_state (
                   id INTEGER PRIMARY KEY CHECK (id = 1),
                   mood TEXT NOT NULL,
                   energy INTEGER NOT NULL CHECK (energy BETWEEN 0 AND 100),
                   location TEXT NOT NULL,
                   activity TEXT NOT NULL,
                   updated_at INTEGER NOT NULL
                 );
                 CREATE TABLE IF NOT EXISTS domain_events (
                   id INTEGER PRIMARY KEY AUTOINCREMENT,
                   event_type TEXT NOT NULL,
                   detail TEXT NOT NULL,
                   occurred_at INTEGER NOT NULL
                 );
                 CREATE TABLE IF NOT EXISTS memories (
                   id INTEGER PRIMARY KEY AUTOINCREMENT,
                   memory_type TEXT NOT NULL CHECK (memory_type IN ('preference','event')),
                   content TEXT NOT NULL CHECK (length(content) BETWEEN 1 AND 400),
                   importance INTEGER NOT NULL CHECK (importance BETWEEN 0 AND 100),
                   created_at INTEGER NOT NULL
                 );
                 CREATE TABLE IF NOT EXISTS diaries (
                   id INTEGER PRIMARY KEY AUTOINCREMENT,
                   local_date TEXT NOT NULL UNIQUE,
                   content TEXT NOT NULL,
                   created_at INTEGER NOT NULL
                 );
                 CREATE TABLE IF NOT EXISTS gallery_photos (
                   id INTEGER PRIMARY KEY AUTOINCREMENT,
                   path TEXT NOT NULL UNIQUE,
                   created_at INTEGER NOT NULL
                 );
                 CREATE TABLE IF NOT EXISTS settings (
                   key TEXT PRIMARY KEY,
                   value TEXT NOT NULL,
                   updated_at INTEGER NOT NULL
                 );
                 PRAGMA user_version=1;",
            )
            .map_err(|error| error.to_string())?;
        Ok(Self {
            connection: Mutex::new(connection),
            data_dir,
        })
    }

    pub fn snapshot(&self, now_ms: i64, local_hour: u8) -> Result<DesktopSnapshot, String> {
        let mut connection = self
            .connection
            .lock()
            .map_err(|_| "本地数据暂时不可用".to_string())?;
        tick_state(&mut connection, now_ms, local_hour)?;
        snapshot_from_connection(&connection)
    }

    pub fn create_buddy(
        &self,
        name: &str,
        avatar_id: &str,
        personality: &str,
        now_ms: i64,
    ) -> Result<DesktopSnapshot, String> {
        let name = name.trim();
        if name.is_empty() || name.chars().count() > 20 {
            return Err("Buddy 名字需要 1–20 个字符".to_string());
        }
        if !matches!(avatar_id, "milo" | "sora" | "mugi") {
            return Err("请选择一个 Buddy 形象".to_string());
        }
        if !matches!(personality, "warm" | "lively" | "quiet") {
            return Err("请选择一个 Buddy 性格".to_string());
        }
        let mut connection = self
            .connection
            .lock()
            .map_err(|_| "本地数据暂时不可用".to_string())?;
        let transaction = connection
            .transaction()
            .map_err(|error| error.to_string())?;
        transaction
            .execute(
                "INSERT INTO buddy_profile (id, name, avatar_id, personality, created_at, updated_at)
                 VALUES (1, ?1, ?2, ?3, ?4, ?4)
                 ON CONFLICT(id) DO UPDATE SET name=?1, avatar_id=?2, personality=?3, updated_at=?4",
                params![name, avatar_id, personality, now_ms],
            )
            .map_err(|error| error.to_string())?;
        transaction
            .execute(
                "INSERT INTO buddy_state (id, mood, energy, location, activity, updated_at)
                 VALUES (1, 'happy', 80, 'living_room', 'idle', ?1)
                 ON CONFLICT(id) DO NOTHING",
                [now_ms],
            )
            .map_err(|error| error.to_string())?;
        transaction
            .execute(
                "INSERT INTO domain_events (event_type, detail, occurred_at) VALUES ('buddy_created', '我们第一次在小屋见面', ?1)",
                [now_ms],
            )
            .map_err(|error| error.to_string())?;
        transaction.commit().map_err(|error| error.to_string())?;
        snapshot_from_connection(&connection)
    }

    pub fn apply_action(&self, action: &str, now_ms: i64) -> Result<DesktopSnapshot, String> {
        let (mood, energy_delta, location, activity, detail) = match action {
            "play" => ("happy", -4, None, "idle", "我们一起玩了一会儿"),
            "read" => (
                "calm",
                -2,
                Some("living_room"),
                "reading",
                "在客厅安静地读书",
            ),
            "cook" => (
                "happy",
                6,
                Some("kitchen"),
                "cooking",
                "一起在厨房准备了食物",
            ),
            "sleep" => ("calm", 25, Some("bedroom"), "sleeping", "回卧室好好休息"),
            "garden" => ("happy", -3, Some("garden"), "gardening", "在花园照顾了植物"),
            "rest" => (
                "calm",
                12,
                Some("living_room"),
                "idle",
                "在沙发上放松了一会儿",
            ),
            _ => return Err("未知的 Buddy 互动".to_string()),
        };
        let connection = self
            .connection
            .lock()
            .map_err(|_| "本地数据暂时不可用".to_string())?;
        let current_energy: i64 = connection
            .query_row("SELECT energy FROM buddy_state WHERE id=1", [], |row| {
                row.get(0)
            })
            .map_err(|_| "请先创建 Buddy".to_string())?;
        let next_energy = (current_energy + energy_delta).clamp(0, 100);
        connection
            .execute(
                "UPDATE buddy_state SET mood=?1, energy=?2, location=COALESCE(?3, location), activity=?4, updated_at=?5 WHERE id=1",
                params![mood, next_energy, location, activity, now_ms],
            )
            .map_err(|error| error.to_string())?;
        connection
            .execute(
                "INSERT INTO domain_events (event_type, detail, occurred_at) VALUES ('interaction', ?1, ?2)",
                params![detail, now_ms],
            )
            .map_err(|error| error.to_string())?;
        snapshot_from_connection(&connection)
    }

    pub fn change_room(&self, room: &str, now_ms: i64) -> Result<DesktopSnapshot, String> {
        let (activity, detail) = match room {
            "living_room" => ("idle", "回到了温暖的客厅"),
            "kitchen" => ("cooking", "走进厨房看看今天吃什么"),
            "bedroom" => ("thinking", "回卧室整理自己的小空间"),
            "garden" => ("gardening", "来到花园看看植物"),
            _ => return Err("未知的房间".to_string()),
        };
        let connection = self
            .connection
            .lock()
            .map_err(|_| "本地数据暂时不可用".to_string())?;
        connection
            .execute(
                "UPDATE buddy_state SET location=?1, activity=?2, updated_at=?3 WHERE id=1",
                params![room, activity, now_ms],
            )
            .map_err(|error| error.to_string())?;
        connection
            .execute(
                "INSERT INTO domain_events (event_type, detail, occurred_at) VALUES ('room_changed', ?1, ?2)",
                params![detail, now_ms],
            )
            .map_err(|error| error.to_string())?;
        snapshot_from_connection(&connection)
    }

    pub fn add_memory(
        &self,
        memory_type: &str,
        content: &str,
        now_ms: i64,
    ) -> Result<DesktopSnapshot, String> {
        if !matches!(memory_type, "preference" | "event") {
            return Err("记忆类型不正确".to_string());
        }
        let content = content.trim();
        if content.is_empty() || content.chars().count() > 400 {
            return Err("记忆内容需要 1–400 个字符".to_string());
        }
        let connection = self
            .connection
            .lock()
            .map_err(|_| "本地数据暂时不可用".to_string())?;
        connection
            .execute(
                "INSERT INTO memories (memory_type, content, importance, created_at) VALUES (?1, ?2, 60, ?3)",
                params![memory_type, content, now_ms],
            )
            .map_err(|error| error.to_string())?;
        connection
            .execute(
                "INSERT INTO domain_events (event_type, detail, occurred_at) VALUES ('memory_saved', '保存了一条值得记住的事情', ?1)",
                [now_ms],
            )
            .map_err(|error| error.to_string())?;
        snapshot_from_connection(&connection)
    }

    pub fn delete_memory(&self, id: i64) -> Result<DesktopSnapshot, String> {
        let connection = self
            .connection
            .lock()
            .map_err(|_| "本地数据暂时不可用".to_string())?;
        connection
            .execute("DELETE FROM memories WHERE id=?1", [id])
            .map_err(|error| error.to_string())?;
        snapshot_from_connection(&connection)
    }

    pub fn generate_diary(&self, local_date: &str, now_ms: i64) -> Result<DesktopSnapshot, String> {
        if local_date.len() != 10
            || !local_date
                .chars()
                .all(|character| character.is_ascii_digit() || character == '-')
        {
            return Err("本地日期格式不正确".to_string());
        }
        let connection = self
            .connection
            .lock()
            .map_err(|_| "本地数据暂时不可用".to_string())?;
        let existing: Option<i64> = connection
            .query_row(
                "SELECT id FROM diaries WHERE local_date=?1",
                [local_date],
                |row| row.get(0),
            )
            .optional()
            .map_err(|error| error.to_string())?;
        if existing.is_none() {
            let day_start = now_ms - 24 * 60 * 60 * 1000;
            let mut statement = connection
                .prepare("SELECT detail FROM domain_events WHERE occurred_at>=?1 ORDER BY occurred_at ASC LIMIT 8")
                .map_err(|error| error.to_string())?;
            let details = statement
                .query_map([day_start], |row| row.get::<_, String>(0))
                .map_err(|error| error.to_string())?
                .filter_map(Result::ok)
                .collect::<Vec<_>>();
            let content = if details.is_empty() {
                "今天的小屋很安静。我整理了房间，也给自己留了一点慢下来的时间。".to_string()
            } else {
                format!(
                    "今天，{}。小屋里留下了一些温暖的痕迹。",
                    details.join("，又")
                )
            };
            drop(statement);
            connection
                .execute(
                    "INSERT INTO diaries (local_date, content, created_at) VALUES (?1, ?2, ?3)",
                    params![local_date, content, now_ms],
                )
                .map_err(|error| error.to_string())?;
        }
        snapshot_from_connection(&connection)
    }

    pub fn delete_diary(&self, id: i64) -> Result<DesktopSnapshot, String> {
        let connection = self
            .connection
            .lock()
            .map_err(|_| "本地数据暂时不可用".to_string())?;
        connection
            .execute("DELETE FROM diaries WHERE id=?1", [id])
            .map_err(|error| error.to_string())?;
        snapshot_from_connection(&connection)
    }

    pub fn import_photo(&self, source: &str, now_ms: i64) -> Result<DesktopSnapshot, String> {
        let source_path = Path::new(source);
        let extension = source_path
            .extension()
            .and_then(|value| value.to_str())
            .unwrap_or_default()
            .to_ascii_lowercase();
        if !matches!(extension.as_str(), "png" | "jpg" | "jpeg" | "webp") {
            return Err("相册支持 PNG、JPG 和 WebP 图片".to_string());
        }
        let metadata = fs::metadata(source_path).map_err(|_| "无法读取这张图片".to_string())?;
        if !metadata.is_file() || metadata.len() > 20 * 1024 * 1024 {
            return Err("图片不能超过 20MB".to_string());
        }
        let gallery_dir = self.data_dir.join("gallery");
        fs::create_dir_all(&gallery_dir).map_err(|error| error.to_string())?;
        let destination = gallery_dir.join(format!("photo-{now_ms}.{extension}"));
        fs::copy(source_path, &destination).map_err(|_| "无法把图片加入相册".to_string())?;
        let connection = self
            .connection
            .lock()
            .map_err(|_| "本地数据暂时不可用".to_string())?;
        connection
            .execute(
                "INSERT INTO gallery_photos (path, created_at) VALUES (?1, ?2)",
                params![destination.to_string_lossy(), now_ms],
            )
            .map_err(|error| error.to_string())?;
        snapshot_from_connection(&connection)
    }

    pub fn delete_photo(&self, id: i64) -> Result<DesktopSnapshot, String> {
        let connection = self
            .connection
            .lock()
            .map_err(|_| "本地数据暂时不可用".to_string())?;
        let path: Option<String> = connection
            .query_row("SELECT path FROM gallery_photos WHERE id=?1", [id], |row| {
                row.get(0)
            })
            .optional()
            .map_err(|error| error.to_string())?;
        if let Some(path) = path {
            let _ = fs::remove_file(path);
        }
        connection
            .execute("DELETE FROM gallery_photos WHERE id=?1", [id])
            .map_err(|error| error.to_string())?;
        snapshot_from_connection(&connection)
    }

    pub fn set_sound(&self, enabled: bool, now_ms: i64) -> Result<DesktopSnapshot, String> {
        let connection = self
            .connection
            .lock()
            .map_err(|_| "本地数据暂时不可用".to_string())?;
        connection
            .execute(
                "INSERT INTO settings (key, value, updated_at) VALUES ('sound_enabled', ?1, ?2)
                 ON CONFLICT(key) DO UPDATE SET value=?1, updated_at=?2",
                params![if enabled { "true" } else { "false" }, now_ms],
            )
            .map_err(|error| error.to_string())?;
        snapshot_from_connection(&connection)
    }

    pub fn export_data(
        &self,
        destination: &str,
        now_ms: i64,
        local_hour: u8,
    ) -> Result<(), String> {
        let snapshot = self.snapshot(now_ms, local_hour)?;
        let payload = serde_json::to_vec_pretty(&snapshot).map_err(|error| error.to_string())?;
        fs::write(destination, payload).map_err(|_| "无法导出 OneShow Home 数据".to_string())
    }

    pub fn clear_all(&self) -> Result<(), String> {
        let mut connection = self
            .connection
            .lock()
            .map_err(|_| "本地数据暂时不可用".to_string())?;
        let transaction = connection
            .transaction()
            .map_err(|error| error.to_string())?;
        for table in [
            "gallery_photos",
            "diaries",
            "memories",
            "domain_events",
            "buddy_state",
            "buddy_profile",
            "settings",
        ] {
            transaction
                .execute(&format!("DELETE FROM {table}"), [])
                .map_err(|error| error.to_string())?;
        }
        transaction.commit().map_err(|error| error.to_string())?;
        let _ = fs::remove_dir_all(self.data_dir.join("gallery"));
        Ok(())
    }
}

fn tick_state(connection: &mut Connection, now_ms: i64, local_hour: u8) -> Result<(), String> {
    let current: Option<(i64, String)> = connection
        .query_row(
            "SELECT updated_at, mood FROM buddy_state WHERE id=1",
            [],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .optional()
        .map_err(|error| error.to_string())?;
    let Some((updated_at, current_mood)) = current else {
        return Ok(());
    };
    let elapsed_hours = ((now_ms - updated_at).max(0) / 3_600_000).clamp(0, 72);
    if elapsed_hours == 0 {
        return Ok(());
    }
    let (location, activity, sleeping) = match local_hour {
        0..=6 | 22..=23 => ("bedroom", "sleeping", true),
        7..=9 => ("kitchen", "cooking", false),
        10..=13 => ("living_room", "reading", false),
        14..=17 => ("garden", "gardening", false),
        _ => ("living_room", "idle", false),
    };
    let current_energy: i64 = connection
        .query_row("SELECT energy FROM buddy_state WHERE id=1", [], |row| {
            row.get(0)
        })
        .map_err(|error| error.to_string())?;
    let energy = if sleeping {
        (current_energy + elapsed_hours * 8).clamp(0, 100)
    } else {
        (current_energy - elapsed_hours * 2).clamp(10, 100)
    };
    let mood = if energy < 25 {
        "tired"
    } else if current_mood == "happy" && elapsed_hours < 2 {
        "happy"
    } else {
        "calm"
    };
    connection
        .execute(
            "UPDATE buddy_state SET mood=?1, energy=?2, location=?3, activity=?4, updated_at=?5 WHERE id=1",
            params![mood, energy, location, activity, now_ms],
        )
        .map_err(|error| error.to_string())?;
    Ok(())
}

fn snapshot_from_connection(connection: &Connection) -> Result<DesktopSnapshot, String> {
    let profile = connection
        .query_row(
            "SELECT name, avatar_id, personality, created_at FROM buddy_profile WHERE id=1",
            [],
            |row| {
                Ok(BuddyProfile {
                    name: row.get(0)?,
                    avatar_id: row.get(1)?,
                    personality: row.get(2)?,
                    created_at: row.get(3)?,
                })
            },
        )
        .optional()
        .map_err(|error| error.to_string())?;
    let state = connection
        .query_row(
            "SELECT mood, energy, location, activity, updated_at FROM buddy_state WHERE id=1",
            [],
            |row| {
                Ok(BuddyState {
                    mood: row.get(0)?,
                    energy: row.get(1)?,
                    location: row.get(2)?,
                    activity: row.get(3)?,
                    updated_at: row.get(4)?,
                })
            },
        )
        .optional()
        .map_err(|error| error.to_string())?;
    let memories = query_memories(connection)?;
    let diaries = query_diaries(connection)?;
    let gallery = query_gallery(connection)?;
    let sound_enabled = connection
        .query_row(
            "SELECT value FROM settings WHERE key='sound_enabled'",
            [],
            |row| row.get::<_, String>(0),
        )
        .optional()
        .map_err(|error| error.to_string())?
        .map(|value| value == "true")
        .unwrap_or(true);
    Ok(DesktopSnapshot {
        profile,
        state,
        memories,
        diaries,
        gallery,
        settings: DesktopSettings { sound_enabled },
    })
}

fn query_memories(connection: &Connection) -> Result<Vec<Memory>, String> {
    let mut statement = connection.prepare("SELECT id, memory_type, content, importance, created_at FROM memories ORDER BY created_at DESC LIMIT 100").map_err(|error| error.to_string())?;
    let rows = statement
        .query_map([], |row| {
            Ok(Memory {
                id: row.get(0)?,
                memory_type: row.get(1)?,
                content: row.get(2)?,
                importance: row.get(3)?,
                created_at: row.get(4)?,
            })
        })
        .map_err(|error| error.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|error| error.to_string())?;
    Ok(rows)
}

fn query_diaries(connection: &Connection) -> Result<Vec<Diary>, String> {
    let mut statement = connection.prepare("SELECT id, local_date, content, created_at FROM diaries ORDER BY local_date DESC LIMIT 60").map_err(|error| error.to_string())?;
    let rows = statement
        .query_map([], |row| {
            Ok(Diary {
                id: row.get(0)?,
                local_date: row.get(1)?,
                content: row.get(2)?,
                created_at: row.get(3)?,
            })
        })
        .map_err(|error| error.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|error| error.to_string())?;
    Ok(rows)
}

fn query_gallery(connection: &Connection) -> Result<Vec<GalleryPhoto>, String> {
    let mut statement = connection
        .prepare(
            "SELECT id, path, created_at FROM gallery_photos ORDER BY created_at DESC LIMIT 100",
        )
        .map_err(|error| error.to_string())?;
    let rows = statement
        .query_map([], |row| {
            Ok(GalleryPhoto {
                id: row.get(0)?,
                path: row.get(1)?,
                created_at: row.get(2)?,
            })
        })
        .map_err(|error| error.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|error| error.to_string())?;
    Ok(rows)
}

#[cfg(test)]
mod tests {
    use super::DesktopStore;

    #[test]
    fn buddy_state_persists_and_offline_time_is_bounded() {
        let directory =
            std::env::temp_dir().join(format!("oneshow-home-store-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&directory);
        let store = DesktopStore::open(directory.clone()).unwrap();
        let created = store.create_buddy("Milo", "milo", "warm", 1_000).unwrap();
        assert_eq!(created.profile.unwrap().name, "Milo");
        let played = store.apply_action("play", 2_000).unwrap();
        assert_eq!(played.state.unwrap().mood, "happy");
        let restored = store.snapshot(10 * 3_600_000, 23).unwrap();
        let state = restored.state.unwrap();
        assert_eq!(state.location, "bedroom");
        assert_eq!(state.activity, "sleeping");
        assert!(state.energy <= 100);
        let _ = std::fs::remove_dir_all(directory);
    }

    #[test]
    fn diary_uses_recorded_events_and_is_unique_per_day() {
        let directory =
            std::env::temp_dir().join(format!("oneshow-home-diary-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&directory);
        let store = DesktopStore::open(directory.clone()).unwrap();
        store.create_buddy("Milo", "milo", "warm", 1_000).unwrap();
        store.apply_action("garden", 2_000).unwrap();
        let first = store.generate_diary("2026-08-11", 3_000).unwrap();
        let second = store.generate_diary("2026-08-11", 4_000).unwrap();
        assert_eq!(first.diaries.len(), 1);
        assert_eq!(second.diaries.len(), 1);
        assert!(second.diaries[0].content.contains("花园"));
        let _ = std::fs::remove_dir_all(directory);
    }
}
