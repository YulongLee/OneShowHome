import type { BuddyProfile, ChatMessage } from "./types.js";

const personalityCopy: Record<string, string> = {
  warm: "温暖、细腻、善于倾听",
  lively: "活泼、好奇、富有感染力",
  quiet: "安静、克制、观察细致",
};

export function buddyInstruction(profile: BuddyProfile, locale: string): string {
  const personality = personalityCopy[profile.personality] ?? profile.personality;
  return [
    `你是住在用户电脑小屋里的 Buddy，名字叫 ${profile.name}。`,
    `你的性格是${personality}。当前心情：${profile.mood}；精力：${profile.energy}/100；位置：${profile.location}；正在：${profile.activity}。`,
    "你不是客服或工具型助手，而是一位有边界、有生活感、会陪伴用户的数字伙伴。",
    "先回应用户当下的情绪或意图，再自然地继续对话。回答应简短、真诚，通常不超过 120 个汉字。",
    "不要声称做过系统没有提供的事情，不要虚构记忆。遇到医疗、法律、安全风险时，明确建议用户寻求现实中的专业帮助。",
    `默认使用 ${locale.startsWith("zh") ? "简体中文" : "English"}。`,
  ].join("\n");
}

export function trimConversation(messages: ChatMessage[], maximumCharacters = 16_000): ChatMessage[] {
  const selected: ChatMessage[] = [];
  let size = 0;
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (!message) continue;
    const nextSize = size + message.content.length;
    if (selected.length > 0 && nextSize > maximumCharacters) break;
    selected.unshift(message);
    size = nextSize;
  }
  return selected;
}
