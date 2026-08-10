CREATE TABLE IF NOT EXISTS installations (
  id UUID PRIMARY KEY,
  token_hash CHAR(64) NOT NULL UNIQUE,
  platform VARCHAR(32) NOT NULL,
  app_version VARCHAR(32) NOT NULL,
  device_name VARCHAR(120),
  locale VARCHAR(16) NOT NULL DEFAULT 'zh-CN',
  status VARCHAR(16) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled', 'deleted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS buddy_profiles (
  installation_id UUID PRIMARY KEY REFERENCES installations(id) ON DELETE CASCADE,
  name VARCHAR(40) NOT NULL DEFAULT 'Milo',
  personality VARCHAR(40) NOT NULL DEFAULT 'warm',
  avatar_id VARCHAR(80) NOT NULL DEFAULT 'buddy-default',
  mood VARCHAR(24) NOT NULL DEFAULT 'calm',
  energy SMALLINT NOT NULL DEFAULT 80 CHECK (energy BETWEEN 0 AND 100),
  location VARCHAR(32) NOT NULL DEFAULT 'living_room',
  activity VARCHAR(32) NOT NULL DEFAULT 'idle',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY,
  installation_id UUID NOT NULL REFERENCES installations(id) ON DELETE CASCADE,
  title VARCHAR(120),
  status VARCHAR(16) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS conversations_installation_updated_idx
  ON conversations(installation_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role VARCHAR(16) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 12000),
  model_purpose VARCHAR(64),
  model_id VARCHAR(160),
  input_tokens INTEGER,
  output_tokens INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS chat_messages_conversation_created_idx
  ON chat_messages(conversation_id, created_at ASC);

CREATE TABLE IF NOT EXISTS memories (
  id UUID PRIMARY KEY,
  installation_id UUID NOT NULL REFERENCES installations(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 4000),
  memory_type VARCHAR(32) NOT NULL DEFAULT 'conversation',
  importance SMALLINT NOT NULL DEFAULT 50 CHECK (importance BETWEEN 0 AND 100),
  source_message_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS memories_installation_importance_idx
  ON memories(installation_id, importance DESC, created_at DESC);

CREATE TABLE IF NOT EXISTS object_assets (
  id UUID PRIMARY KEY,
  installation_id UUID NOT NULL REFERENCES installations(id) ON DELETE CASCADE,
  provider VARCHAR(24) NOT NULL CHECK (provider IN ('oss')),
  object_key VARCHAR(512) NOT NULL UNIQUE,
  media_type VARCHAR(120) NOT NULL,
  byte_size BIGINT NOT NULL CHECK (byte_size >= 0),
  status VARCHAR(16) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'available', 'deleted', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
