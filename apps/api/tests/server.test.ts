import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import test from "node:test";
import type { AddressInfo } from "node:net";
import { createApiServer } from "../src/server.js";
import type { BuddyProfile, ChatMessage, Installation, ModelProvider, Repository } from "../src/types.js";

const buddy: BuddyProfile = {
  name: "Milo", personality: "warm", avatarId: "buddy-default", mood: "calm",
  energy: 80, location: "living_room", activity: "idle",
};

class MemoryRepository implements Repository {
  installation: Installation | null = null;
  tokenHash: string | null = null;
  messages: ChatMessage[] = [];
  conversationId = randomUUID();
  async ready() {}
  async close() {}
  async createInstallation(input: { locale: string; tokenHash: string }): Promise<Installation> {
    this.tokenHash = input.tokenHash;
    this.installation = { id: randomUUID(), locale: input.locale, buddy };
    return this.installation;
  }
  async findInstallationByTokenHash(hash: string) { return hash === this.tokenHash ? this.installation : null; }
  async updateBuddy() { return buddy; }
  async getOrCreateConversation() { return this.conversationId; }
  async recentMessages() { return this.messages; }
  async appendMessage(input: { role: "user" | "assistant"; content: string }) {
    this.messages.push({ role: input.role, content: input.content });
  }
}

test("installation token authenticates a stored Buddy conversation", async () => {
  const repository = new MemoryRepository();
  const modelProvider: ModelProvider = {
    async chat(input) {
      assert.match(input.instruction, /Milo/);
      assert.equal(input.messages.at(-1)?.content, "今天有点累");
      return { text: "那就先在沙发上歇一会儿。", modelId: "test-model", inputTokens: 12, outputTokens: 8 };
    },
  };
  const server = createApiServer({
    config: {
      host: "127.0.0.1", port: 0, databaseUrl: "unused", allowedOrigins: new Set(),
      modelPurpose: "oneshow_home_chat", modelGatewayUrl: "http://internal", modelGatewayToken: "x".repeat(40),
      directModel: null, modelTimeoutMs: 5_000,
    },
    repository,
    modelProvider,
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  try {
    const registration = await fetch(`${baseUrl}/v1/installations`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ platform: "macos", appVersion: "0.1.0", locale: "zh-CN" }),
    });
    assert.equal(registration.status, 201);
    const credential = await registration.json() as { token: string };
    assert.equal(createHash("sha256").update(credential.token).digest("hex"), repository.tokenHash);

    const chat = await fetch(`${baseUrl}/v1/chat`, {
      method: "POST",
      headers: { authorization: `Bearer ${credential.token}`, "content-type": "application/json" },
      body: JSON.stringify({ message: "今天有点累" }),
    });
    assert.equal(chat.status, 200);
    assert.deepEqual(await chat.json(), { conversationId: repository.conversationId, reply: "那就先在沙发上歇一会儿。" });
    assert.deepEqual(repository.messages.map((message) => message.role), ["user", "assistant"]);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
