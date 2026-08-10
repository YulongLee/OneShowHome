export type BuddyProfile = {
  name: string;
  personality: string;
  avatarId: string;
  mood: string;
  energy: number;
  location: string;
  activity: string;
};

export type Installation = {
  id: string;
  locale: string;
  buddy: BuddyProfile;
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ModelResult = {
  text: string;
  modelId: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
};

export interface Repository {
  ready(): Promise<void>;
  close(): Promise<void>;
  createInstallation(input: {
    platform: string;
    appVersion: string;
    deviceName: string | null;
    locale: string;
    tokenHash: string;
  }): Promise<Installation>;
  findInstallationByTokenHash(tokenHash: string): Promise<Installation | null>;
  updateBuddy(installationId: string, input: Partial<Pick<BuddyProfile, "name" | "personality" | "avatarId">>): Promise<BuddyProfile>;
  getOrCreateConversation(installationId: string, conversationId: string | null): Promise<string>;
  recentMessages(installationId: string, conversationId: string, limit: number): Promise<ChatMessage[]>;
  appendMessage(input: {
    conversationId: string;
    role: "user" | "assistant";
    content: string;
    modelPurpose?: string;
    modelId?: string | null;
    inputTokens?: number | null;
    outputTokens?: number | null;
  }): Promise<void>;
}

export interface ModelProvider {
  chat(input: {
    purpose: string;
    instruction: string;
    messages: ChatMessage[];
    signal: AbortSignal;
  }): Promise<ModelResult>;
}
