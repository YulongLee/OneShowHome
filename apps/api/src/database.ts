import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { Pool, type PoolClient } from "pg";
import type { BuddyProfile, ChatMessage, Installation, Repository } from "./types.js";

type BuddyRow = {
  name: string;
  personality: string;
  avatar_id: string;
  mood: string;
  energy: number;
  location: string;
  activity: string;
};

const buddyFromRow = (row: BuddyRow): BuddyProfile => ({
  name: row.name,
  personality: row.personality,
  avatarId: row.avatar_id,
  mood: row.mood,
  energy: row.energy,
  location: row.location,
  activity: row.activity,
});

export class PostgresRepository implements Repository {
  readonly #pool: Pool;

  constructor(connectionString: string) {
    this.#pool = new Pool({
      connectionString,
      max: 10,
      connectionTimeoutMillis: 5_000,
      idleTimeoutMillis: 30_000,
    });
  }

  async migrate(): Promise<void> {
    const migration = await readFile(new URL("../migrations/0001_initial.sql", import.meta.url), "utf8");
    await this.#pool.query(migration);
  }

  async ready(): Promise<void> {
    await this.#pool.query("SELECT 1");
  }

  async close(): Promise<void> {
    await this.#pool.end();
  }

  async createInstallation(input: {
    platform: string;
    appVersion: string;
    deviceName: string | null;
    locale: string;
    tokenHash: string;
  }): Promise<Installation> {
    const client = await this.#pool.connect();
    const id = randomUUID();
    try {
      await client.query("BEGIN");
      await client.query(
        `INSERT INTO installations (id, token_hash, platform, app_version, device_name, locale)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, input.tokenHash, input.platform, input.appVersion, input.deviceName, input.locale],
      );
      const buddy = await client.query<BuddyRow>(
        `INSERT INTO buddy_profiles (installation_id) VALUES ($1)
         RETURNING name, personality, avatar_id, mood, energy, location, activity`,
        [id],
      );
      await client.query("COMMIT");
      return { id, locale: input.locale, buddy: buddyFromRow(buddy.rows[0]!) };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async findInstallationByTokenHash(tokenHash: string): Promise<Installation | null> {
    const result = await this.#pool.query<BuddyRow & { id: string; locale: string }>(
      `UPDATE installations AS i SET last_seen_at = NOW()
       FROM buddy_profiles AS b
       WHERE i.token_hash = $1 AND i.status = 'active' AND b.installation_id = i.id
       RETURNING i.id, i.locale, b.name, b.personality, b.avatar_id, b.mood, b.energy, b.location, b.activity`,
      [tokenHash],
    );
    const row = result.rows[0];
    return row ? { id: row.id, locale: row.locale, buddy: buddyFromRow(row) } : null;
  }

  async updateBuddy(installationId: string, input: Partial<Pick<BuddyProfile, "name" | "personality" | "avatarId">>): Promise<BuddyProfile> {
    const current = await this.#pool.query<BuddyRow>(
      `UPDATE buddy_profiles SET
         name = COALESCE($2, name), personality = COALESCE($3, personality),
         avatar_id = COALESCE($4, avatar_id), updated_at = NOW()
       WHERE installation_id = $1
       RETURNING name, personality, avatar_id, mood, energy, location, activity`,
      [installationId, input.name ?? null, input.personality ?? null, input.avatarId ?? null],
    );
    if (!current.rows[0]) throw new Error("BUDDY_NOT_FOUND");
    return buddyFromRow(current.rows[0]);
  }

  async getOrCreateConversation(installationId: string, conversationId: string | null): Promise<string> {
    if (conversationId) {
      const owned = await this.#pool.query<{ id: string }>(
        "SELECT id FROM conversations WHERE id = $1 AND installation_id = $2 AND status = 'active'",
        [conversationId, installationId],
      );
      if (!owned.rows[0]) throw new Error("CONVERSATION_NOT_FOUND");
      return owned.rows[0].id;
    }
    const id = randomUUID();
    await this.#pool.query(
      "INSERT INTO conversations (id, installation_id) VALUES ($1, $2)",
      [id, installationId],
    );
    return id;
  }

  async recentMessages(installationId: string, conversationId: string, limit: number): Promise<ChatMessage[]> {
    const result = await this.#pool.query<ChatMessage>(
      `SELECT m.role, m.content FROM (
         SELECT cm.role, cm.content, cm.created_at
         FROM chat_messages AS cm
         JOIN conversations AS c ON c.id = cm.conversation_id
         WHERE c.id = $1 AND c.installation_id = $2
         ORDER BY cm.created_at DESC LIMIT $3
       ) AS m ORDER BY m.created_at ASC`,
      [conversationId, installationId, limit],
    );
    return result.rows;
  }

  async appendMessage(input: {
    conversationId: string;
    role: "user" | "assistant";
    content: string;
    modelPurpose?: string;
    modelId?: string | null;
    inputTokens?: number | null;
    outputTokens?: number | null;
  }): Promise<void> {
    await this.#pool.query(
      `INSERT INTO chat_messages
         (id, conversation_id, role, content, model_purpose, model_id, input_tokens, output_tokens)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        randomUUID(), input.conversationId, input.role, input.content,
        input.modelPurpose ?? null, input.modelId ?? null,
        input.inputTokens ?? null, input.outputTokens ?? null,
      ],
    );
    await this.#pool.query("UPDATE conversations SET updated_at = NOW() WHERE id = $1", [input.conversationId]);
  }
}

export async function withTransaction<T>(pool: Pool, action: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await action(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
