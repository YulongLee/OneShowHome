import assert from "node:assert/strict";
import test from "node:test";
import { buddyInstruction, trimConversation } from "../src/buddy.js";
import { modelResponseText } from "../src/model-provider.js";

const buddy = {
  name: "Milo",
  personality: "warm",
  avatarId: "buddy-default",
  mood: "calm",
  energy: 80,
  location: "living_room",
  activity: "reading",
};

test("Buddy prompt carries identity and avoids fabricated memory", () => {
  const prompt = buddyInstruction(buddy, "zh-CN");
  assert.match(prompt, /Milo/);
  assert.match(prompt, /不要虚构记忆/);
  assert.match(prompt, /简体中文/);
});

test("conversation trimming keeps the newest complete messages", () => {
  const messages = [
    { role: "user" as const, content: "1111" },
    { role: "assistant" as const, content: "2222" },
    { role: "user" as const, content: "3333" },
  ];
  assert.deepEqual(trimConversation(messages, 8), messages.slice(1));
});

test("OpenAI-compatible response must contain assistant text", () => {
  assert.equal(modelResponseText({ choices: [{ message: { content: "  欢迎回家  " } }] }), "欢迎回家");
  assert.throws(() => modelResponseText({ choices: [] }), /MODEL_INVALID_RESPONSE/);
});
