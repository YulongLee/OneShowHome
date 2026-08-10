# OneShow Home 技术架构

> 状态：Proposed
> 适用范围：macOS MVP

## 1. 架构目标

产品世界的分层、基本法则、聚合和领域事件命名由 [`world-architecture.md`](../product/world-architecture.md) 约束。本文负责这些规则在 macOS MVP 中的技术落地。

- 桌面体验稳定，主窗口与小屋窗口生命周期清晰；
- Buddy 行为不依赖 React 页面或在线 AI；
- 数据默认本地保存，密钥与业务数据分离；
- AI Provider、渲染方案和持久化实现可以替换；
- 为未来房间和世界扩展保留边界，但不提前开发分布式系统。

## 2. 技术基线

- Tauri v2；
- React；
- TypeScript 严格模式；
- Rust stable；
- pnpm workspace；
- SQLite 和版本化迁移；
- Vitest + Testing Library；
- Rust 单元测试；
- GitHub Actions 持续集成。

依赖版本以 lockfile 为准。升级 Tauri、插件、数据库或构建工具时单独提交，并完成生产构建验证。

## 3. 系统边界

```text
┌───────────────────────────────────────────┐
│                 React UI                  │
│ Onboarding · House · Home · Chat · Settings │
└───────────────────┬───────────────────────┘
                    │ typed application APIs
┌───────────────────▼───────────────────────┐
│              Application Layer            │
│ use cases · orchestration · view models   │
└──────────────┬─────────────────┬───────────┘
               │                 │
┌──────────────▼─────────┐ ┌─────▼──────────────┐
│ Domain                 │ │ Infrastructure      │
│ state machine          │ │ Tauri commands      │
│ schedule rules         │ │ SQLite migrations   │
│ memory policy          │ │ secure secrets      │
│ diary eligibility      │ │ provider clients    │
└────────────────────────┘ └─────────────────────┘
```

### 依赖规则

- UI 可以依赖 Application 和 Domain；
- Application 可以依赖 Domain，不依赖具体页面；
- Domain 不依赖 React、Tauri、SQLite 或具体 AI SDK；
- Infrastructure 实现 Application 定义的端口；
- 任何层都不得绕过接口直接读取密钥。

## 4. 仓库结构

```text
OneShowHome/
├── apps/
│   └── desktop/
│       ├── src/
│       │   ├── app/
│       │   ├── components/
│       │   ├── features/
│       │   │   ├── onboarding/
│       │   │   ├── house/
│       │   │   ├── home/
│       │   │   ├── buddy/
│       │   │   ├── chat/
│       │   │   └── settings/
│       │   ├── services/
│       │   ├── styles/
│       │   └── assets/
│       ├── src-tauri/
│       │   ├── capabilities/
│       │   ├── migrations/
│       │   ├── src/
│       │   │   ├── commands/
│       │   │   ├── persistence/
│       │   │   ├── providers/
│       │   │   ├── security/
│       │   │   └── windows/
│       │   └── tauri.conf.json
│       └── package.json
├── packages/
│   ├── domain/
│   └── ui/
├── docs/
├── package.json
└── pnpm-workspace.yaml
```

在只有一个应用时不新增更多 package。只有代码存在两个明确消费者时才提取共享包。

## 5. 窗口模型

### `house`

- 透明、无边框、小尺寸；
- 不显示普通标题栏；
- 保存逻辑位置和显示器标识；
- 点击打开或聚焦 `main`；
- 不承担数据库、计时器或 AI 生命周期。

### `main`

- 承载 Onboarding、Home、Chat 和 Settings；
- 关闭时默认隐藏，不结束后台生命周期；
- 从菜单栏或 `house` 恢复；
- 页面切换由前端路由管理。

### `tray`

- 显示/隐藏小屋；
- 打开 Home；
- 打开设置；
- 退出应用。

窗口层级、多桌面空间、全屏和透明区域输入行为必须通过 Phase 0 实机验证。最终结果写入 ADR，不把未经验证的行为当作已支持能力。

## 6. Buddy Life Engine

Life Engine 是纯领域模块。输入为当前状态、时间和领域事件，输出为新状态和产生的领域事件。

```typescript
interface Clock {
  now(): Date;
}

interface RandomSource {
  next(): number;
}

interface TransitionResult {
  state: BuddyState;
  events: BuddyEvent[];
}

function transition(
  state: BuddyState,
  event: BuddyEvent,
  context: { clock: Clock; random: RandomSource },
): TransitionResult;
```

要求：

- 时间和随机数均可注入；
- 同一输入可在测试中复现；
- UI 只发送意图，不直接写状态；
- 持久化由应用层在转换成功后完成；
- 应用恢复时使用时间差补算，不尝试回放每一分钟；
- 状态变化产生领域事件，供日记和记忆使用。

## 7. 数据模型

建议初始表：

### `buddy_profile`

- `id`
- `name`
- `avatar_id`
- `personality_id`
- `created_at`
- `updated_at`

### `buddy_state`

- `buddy_id`
- `mood`
- `energy`
- `location`
- `activity`
- `updated_at`
- `version`

### `domain_events`

- `id`
- `event_type`
- `payload_json`
- `occurred_at`
- `processed_at`

### `chat_sessions`

- `id`
- `started_at`
- `ended_at`

### `chat_messages`

- `id`
- `session_id`
- `role`
- `content`
- `created_at`
- `provider`
- `status`

### `memories`

- `id`
- `type`
- `content`
- `source_message_id`
- `importance`
- `created_at`
- `last_used_at`

### `diaries`

- `id`
- `local_date`
- `content`
- `created_at`
- `generation_status`
- 对 `local_date` 建唯一约束

### `settings`

- `key`
- `value_json`
- `updated_at`

API Key、令牌和签名凭证不属于上述数据模型。

## 8. 数据访问

- SQLite 文件放在系统应用数据目录；
- 应用启动时先完成迁移，再加载业务状态；
- 迁移只向前执行并纳入 Git；
- 迁移必须在事务内完成；
- SQL 使用参数绑定；
- React 组件不直接拼接 SQL；
- 数据库访问通过 repository 或明确的 Tauri command；
- 删除账户数据时同时清除数据库、缓存和安全存储中的用户密钥。

## 9. AI Provider 边界

```typescript
interface AIProvider {
  validateCredentials(): Promise<ProviderStatus>;
  chat(request: ChatRequest): Promise<ChatResponse>;
  extractMemories(request: MemoryRequest): Promise<MemoryCandidate[]>;
  generateDiary(request: DiaryRequest): Promise<DiaryDraft>;
}
```

规则：

- UI 只选择 Provider 和发起用例；
- Provider SDK 和网络访问位于基础设施层；
- 系统提示词按版本管理；
- 请求设置超时和取消；
- 输出通过结构校验后才能写入数据库；
- 聊天成功不依赖记忆提取成功；
- 日记不能把模型推测当作已发生事实；
- 不提供在线服务时，核心本地体验保持可用。

## 10. Tauri 安全边界

- 使用最小 capabilities 权限；
- 默认关闭未使用的文件系统、Shell、网络和进程能力；
- 仅允许受控的外部域名；
- 建立内容安全策略；
- 不向 `window` 注入不必要的全局 Tauri API；
- Rust command 输入进行类型和长度校验；
- 日志不记录密钥、完整 Prompt、聊天正文或数据库内容。

## 11. 测试策略

### Domain

- 状态转换；
- 能量边界；
- 昼夜切换；
- 离线补算；
- 随机行为复现；
- 日记生成资格。

### UI

- 首次启动流程；
- 加载、空、错误和离线状态；
- Buddy 状态渲染；
- 设置和数据删除确认；
- 键盘和 Reduce Motion。

### Rust / Infrastructure

- 数据库迁移；
- repository；
- command 输入验证；
- Provider 错误映射；
- 密钥读取失败。

### macOS 实机

- 多显示器；
- 多桌面空间；
- 全屏应用；
- 睡眠和唤醒；
- 开机启动；
- 干净安装、升级、卸载和数据清除；
- Apple Silicon 发布构建。

## 12. 可观测性

- 本地结构化日志默认不包含用户内容；
- 开发构建可提高日志级别，发布构建默认精简；
- 崩溃上报必须由用户主动同意；
- 性能基线记录启动时间、空闲 CPU、内存和动画帧率；
- 每次正式发布保留测试设备、系统版本和结果记录。
