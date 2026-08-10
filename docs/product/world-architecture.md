# OneShow Home 世界观与领域架构

> 版本：0.1  
> 状态：Proposed Canon  
> 适用范围：产品世界观、Buddy Life Engine、本地后端与未来在线能力  
> 当前实现边界：macOS Local MVP

## 1. 文档目的

本文件定义 OneShow Home 长期产品所共享的世界规则，以及这些规则如何映射为可持续演进的后端领域模型。

它解决三个问题：

1. 用户进入的是一个怎样的世界；
2. Buddy、Home、时间、记忆与关系遵循什么规则；
3. 当前本地后端如何实现核心世界，同时为未来 Town 和 World 保留清晰边界。

本文是世界观和领域模型的上层约束，不代表 Town、World、社交、经济或云服务已经进入开发范围。当前版本仍严格遵守 `mvp-spec.md` 和本地优先 ADR。

## 2. 世界的一句话定义

OneShow Home 是存在于用户 Mac 边缘的一片安静数字世界。用户拥有一个私人 Home，Buddy 在其中按自己的生活节奏持续生活；用户每次回来，看到的都是同一段关系和时间的延续，而不是一次重新开始的会话。

## 3. 世界主题

### 3.1 归属

产品首先提供“有一个地方可以回来”的感受。Home 是所有体验的原点，未来任何 Town 或 World 能力都不能取代 Home。

### 3.2 陪伴

Buddy 不是等待命令的工具，也不是需要用户维持生存的宠物。它通过状态、动作、记忆和低频主动行为表达持续存在。

### 3.3 时间

这个世界与用户共享昼夜和日期，但不会监控用户现实生活。时间会带来光线、作息、植物和日记变化，不会制造逾期惩罚。

### 3.4 痕迹

一次问候、一段对话、一篇日记或一株成长的植物，都可以成为共同生活留下的痕迹。成长来自共同经历，不来自金币、签到或重复任务。

### 3.5 远方

Home 之外可以存在更大的 Town 和 World，但探索的意义是带回故事、风景和关系，而不是建立高压任务、竞争或消费循环。

## 4. 世界分层

```text
现实生活
  │ 只接收用户主动输入、系统时间和明确授权的数据
  ▼
House / Threshold（桌面入口）
  │ 看见、靠近、点击、拖动
  ▼
Home（私人世界，当前核心）
  ├── Living Room
  ├── Kitchen
  ├── Bedroom
  ├── Garden
  ├── Buddy Life
  └── Memory Timeline
  │ 用户未来主动选择连接
  ▼
Town（小规模、低压力的邻里层，未来可选）
  │ 探索入口与公共内容
  ▼
World（区域、旅途和长期叙事层，未来方向）
```

### 4.1 Reality Boundary：现实边界

现实生活不是可被游戏化或被监控的世界层。

允许进入 OneShow Home 的现实信号只有：

- 用户主动输入的文字和选择；
- 用户明确触发的互动；
- Mac 本地时间、日期和时区；
- 用户单独授权的能力。

默认禁止读取屏幕、键盘、剪贴板、浏览器历史、文件、麦克风、摄像头和其他应用状态。Buddy 不得声称看见了系统没有观察到的现实行为。

### 4.2 House / Threshold：桌面入口

House 是现实桌面和数字 Home 之间的门槛，不是缩小版主应用。

职责：

- 用小屋光线、天气和 Buddy 动作表达当前状态；
- 接收轻点、拖动和低频互动；
- 打开或聚焦 Home；
- 保持低资源、低打扰和随时可隐藏。

House 不拥有独立业务状态，不运行 AI，不直接访问数据库。它只渲染 Home 和 Buddy 的只读投影，并把用户意图发送给应用层。

### 4.3 Home：私人世界

Home 是一个用户与一个 Buddy 共同生活的私人空间，也是 MVP 唯一的世界权威范围。

Home 的基本特征：

- 默认只存在于本机；
- 不需要账号或网络才能运行；
- 房间、状态、记忆和日记具有连续性；
- 用户可以查看、导出和删除自己的数据；
- Home 不因离线或 AI 故障停止存在。

### 4.4 Town：邻里层

Town 是未来可选的轻社交层，不是 MVP 的隐藏需求。

若未来立项，优先采用：

- 用户主动加入；
- 异步拜访、明信片和公开装扮；
- 默认不公开聊天、记忆、日记和私人状态；
- 无排行榜、掠夺、强制组队或连续在线要求；
- 可随时离开并回到完整可用的私人 Home。

Town 引入账号、社交图谱、内容审核和服务端数据后，必须单独编写 ADR、安全方案和阶段验收。

### 4.5 World：探索层

World 是未来的区域和旅途体系，用于承载季节、风景、角色相遇和长期故事。

可能的体验包括：

- Buddy 从短途探索中带回一张明信片；
- Home 的窗外出现曾经到访的区域；
- 用户与 Buddy 共同选择下一次旅途；
- 世界事件改变公共风景，但不破坏私人 Home。

World 不等同于大型多人在线游戏。是否需要实时多人、开放世界或经济系统，必须由未来用户证据重新决定。

## 5. Home 空间结构

| 空间        | 世界意义       | 核心状态                 | 当前范围         |
| ----------- | -------------- | ------------------------ | ---------------- |
| Living Room | 相遇与关系中心 | 问候、聊天、阅读、发呆   | Phase 1–2 核心   |
| Kitchen     | 日常与照料     | 做饭、饮水、分享食物故事 | Phase 3 最小表现 |
| Bedroom     | 休息与时间     | 睡眠、夜间、安静模式     | Phase 3 最小表现 |
| Garden      | 时间积累       | 浇水、季节、植物成长     | Phase 3 最小表现 |

房间不是菜单页面，而是 Buddy 行为发生的空间。只有当一个房间至少拥有一种可理解状态、一个可见动作和一次有效互动时，才允许正式开放。

## 6. Buddy 的世界身份

### 6.1 定义

Buddy 是 Home 的数字居民。它具有稳定身份、有限人格、生活状态、关系记忆和可理解的行为原因。

Buddy 不是：

- 具有人类意识或现实身体的生命；
- 监控用户的系统代理；
- 必须服从所有命令的助手；
- 因用户离开而死亡、生病或受罚的养成对象；
- AI Provider 或某个模型的拟人化名称。

### 6.2 身份组成

```typescript
interface BuddyIdentity {
  id: string;
  name: string;
  avatarId: string;
  personalityId: string;
  createdAt: string;
}

interface BuddyLifeState {
  mood: "happy" | "calm" | "sad" | "tired";
  energy: number;
  location: "living_room" | "kitchen" | "bedroom" | "garden";
  activity:
    "idle" | "reading" | "cooking" | "sleeping" | "gardening" | "thinking";
  stateReason: string;
  updatedAt: string;
  version: number;
}
```

`stateReason` 是领域可解释性字段，例如 `daily_schedule`、`user_greeting`、`energy_recovery` 或 `offline_catchup`。UI 可以把它翻译成自然表达，但不能虚构原因。

### 6.3 人格

人格由少量稳定维度组成，而不是每次聊天重新生成：

- 社交节奏：安静、均衡、活泼；
- 表达方式：温柔、好奇、幽默；
- 日常偏好：阅读、植物、做饭、观察天气；
- 边界：不责备、不占有、不声称监控现实。

人格决定同一事件的表达方式，不绕过世界规则，也不直接决定持久化事实。

### 6.4 关系成长

关系成长来自共享时间和真实互动，不使用可购买的好感度。

后端可以记录：

- `shared_days`：发生过有效互动的自然日数；
- `meaningful_interactions`：形成领域事件的互动数；
- `memory_count`：用户保留的关系记忆数；
- `milestones`：首次见面、第一篇日记等不可重复事件。

可以由上述事实派生关系阶段，但不显示进度条，也不会因用户离开而下降：

```text
settling_in → familiar → trusted_companion
```

## 7. 世界时间

### 7.1 时间来源

MVP 使用 Mac 当前本地时间和时区。服务端时间不能成为 Home 正常运行的依赖。

### 7.2 时间层级

```text
Instant      精确事件时间
Day Phase    morning / daytime / evening / night
Local Date   日记与共享天数
Season       未来视觉和植物变化
Era          未来大型世界内容版本
```

### 7.3 离线补算

应用恢复时不逐分钟回放行为，而是根据时间差进行确定性补算：

| 离线时长     | 处理方式                         |
| ------------ | -------------------------------- |
| 少于 2 小时  | 继续当前活动或完成一次短活动     |
| 2–24 小时    | 根据当前时段选择合理位置和状态   |
| 超过 24 小时 | 生成简短生活摘要，恢复到当前时段 |

补算不得产生疾病、死亡、资源负债、连续签到中断或责备文案。

### 7.4 Schedule

Schedule 提供生活倾向，不是强制脚本：

```text
08:00–10:00  wake / breakfast
10:00–12:00  reading / idle
12:00–14:00  cooking / rest
14:00–18:00  garden / reading
18:00–22:00  living_room / chat_ready
22:00–08:00  sleeping
```

具体行为由当前时间、精力、最近事件、人格偏好和可用房间共同决定，并可通过固定随机种子复现。

## 8. 记忆、日记与世界变化

### 8.1 事实链

```text
User Intent
  → Domain Command
  → State Transition
  → Domain Event
  → Memory Candidate
  → User-visible Memory
  → Daily Diary
  → Optional Home Expression
```

只有已经持久化的领域事件可以成为记忆和日记事实。模型生成内容不能反向证明事件发生过。

### 8.2 Memory

MVP 只实现：

- `preference`：用户明确表达且允许保存的偏好；
- `event`：用户与 Buddy 之间已经发生的关系事件。

未来可以评估 `milestone` 和 `keepsake`，但当前不增加类型。

每条记忆必须保留来源、重要性、创建时间、最后使用时间和删除能力。敏感信息遵守 `security-and-privacy.md`。

### 8.3 Diary

Diary 是 Buddy 对已发生一天的简短叙述，不是对用户桌面行为的监控报告。

规则：

- 每个本地自然日最多一篇；
- 只引用当天已持久化事件；
- 无足够内容时使用诚实的生活模板；
- 生成失败不阻塞状态系统；
- 用户可以删除，删除后不影响 Buddy 安全和关系阶段。

### 8.4 Home Expression

记忆可以在未来产生低强度环境表达，例如照片、植物叶片或书架纪念物。它们是故事痕迹，不是货币、战力或任务奖励。

## 9. 世界基本法则

以下规则是产品 Canon，也是后端不可绕过的领域约束：

1. **连续性法则**：同一个 Home 和 Buddy 在重启后继续存在。
2. **Home 优先法则**：在线服务失败不能使私人 Home 不可用。
3. **真实事件法则**：记忆和日记只能基于真实领域事件。
4. **温和时间法则**：离线时间产生变化，但不产生惩罚。
5. **非监控法则**：没有权限和事件来源，就不能声称知道现实行为。
6. **用户主权法则**：用户可以查看、导出和删除私人数据。
7. **非伤害法则**：Buddy 不通过死亡、疾病、责备、占有或付费制造依赖。
8. **可解释状态法则**：持久化状态变化必须有明确原因。
9. **AI 非权威法则**：LLM 负责表达和候选内容，不直接决定世界事实。
10. **渐进扩展法则**：Town 和 World 必须建立在已验证的 Home 体验上。

## 10. 后端领域架构

### 10.1 权威来源

当前世界的权威来源是本机领域后端和 SQLite，而不是 React UI、动画、Prompt 或云服务器。

```text
React UI
  │ command / query
  ▼
Application Use Cases
  │ validates intent
  ▼
Domain Engine
  │ transition + events
  ▼
Local Transaction
  ├── aggregate state
  └── domain_events
       │
       ├── UI projections
       ├── memory pipeline
       └── diary pipeline
```

### 10.2 聚合边界

#### Buddy Aggregate

负责：

- 身份和人格引用；
- 情绪、精力、位置和活动；
- 状态转换与版本冲突；
- 关系事实计数和里程碑。

#### Home Aggregate

负责：

- Home 身份；
- 已开放房间；
- 当前视觉时段；
- 未来植物和纪念物状态。

MVP 不建立家具库存、货币或道具经济。

#### Timeline Aggregate

负责：

- 领域事件流；
- 记忆来源；
- 每日日记唯一性；
- 已处理事件游标。

#### Conversation Aggregate

负责：

- 会话和消息状态；
- Provider 请求结果；
- 可进入记忆提取的成功消息；
- 失败、取消和重试状态。

聊天失败不回滚 Buddy 的本地生命状态。

### 10.3 命令

MVP 推荐命令：

```text
CreateBuddy
OpenHome
GreetBuddy
StartConversation
SendChatMessage
ChangeRoom
AdvanceWorldTime
RecoverFromOffline
SaveMemory
DeleteMemory
GenerateDailyDiary
DeleteDiary
UpdateSettings
DeleteLocalWorld
```

命令表达用户意图，不等同于数据库更新语句。

### 10.4 领域事件

事件名称采用过去时，结构包含 `event_id`、`event_type`、`aggregate_id`、`occurred_at`、`local_date`、`timezone`、`schema_version` 和 `payload`。

首批事件：

```text
buddy.created
buddy.greeted
buddy.mood_changed
buddy.energy_changed
buddy.activity_changed
buddy.location_changed
home.opened
room.entered
conversation.started
chat.message_completed
memory.saved
memory.deleted
diary.generated
diary.deleted
world.offline_recovered
```

不是每次动画帧都产生事件。只有影响业务连续性、记忆或日记的变化才写入事件流。

### 10.5 事务规则

一次状态变化必须在同一个本地事务中完成：

1. 读取聚合及版本；
2. 验证命令；
3. 运行确定性状态转换；
4. 更新聚合状态；
5. 追加领域事件；
6. 提交事务；
7. 提交成功后通知 UI 和异步处理器。

AI 请求、记忆提取和日记生成不占用长数据库事务。

## 11. 本地与云的职责边界

| 能力                 | 当前权威位置        | 未来可选位置           |
| -------------------- | ------------------- | ---------------------- |
| Buddy 身份和生命状态 | 本地                | 加密同步副本           |
| Home 和房间          | 本地                | 加密同步副本           |
| 聊天、记忆、日记     | 本地                | 用户主动开启的加密备份 |
| API Key              | macOS Keychain      | 不同步                 |
| AI 生成              | 用户选择的 Provider | 可替换 AI Gateway      |
| Town 身份和社交图谱  | 不实现              | 服务端                 |
| World 公共内容       | 内置版本资源        | 内容服务/CDN           |
| 审核与举报           | 不实现              | Town 立项后服务端      |

当前服务器只用于官网和发布能力，不成为桌面 Home 的运行依赖。

## 12. 数据模型实施建议

MVP 立即需要的表保持与 `engineering/architecture.md` 一致：

- `buddy_profile`；
- `buddy_state`；
- `domain_events`；
- `chat_sessions`；
- `chat_messages`；
- `memories`；
- `diaries`；
- `settings`。

建议补充：

- 所有业务 ID 使用不可推断的稳定 ID；
- `buddy_state` 使用 `version` 做乐观并发控制；
- `domain_events` 增加 `aggregate_id`、`local_date`、`timezone` 和 `schema_version`；
- 日记唯一键采用 `local_date`；
- 所有删除操作明确采用硬删除还是可恢复删除；MVP 私密数据删除默认硬删除；
- 数据库建立 `user_version` 或独立迁移表。

Town、World、社交图谱、经济和物品表现在不创建。未来需要时通过向前迁移增加，不用空表表达愿景。

## 13. AI 在世界中的位置

AI 负责：

- 把已知状态表达成自然语言；
- 根据允许的上下文生成对话回复；
- 提出记忆候选；
- 根据事件草拟日记。

AI 不负责：

- 直接写 Buddy 状态；
- 声称未发生的现实事件；
- 决定哪些敏感信息必须保存；
- 绕过用户删除；
- 决定 Town 或 World 的权威结果；
- 在 Provider 不可用时让 Buddy 消失。

所有结构化 AI 输出必须经过 schema 校验、内容边界检查和应用层确认后才能持久化。

## 14. 演进阶段

### Stage A：Private Home Kernel

当前应实现：

- SQLite 迁移框架；
- Buddy、Home 和 Timeline 聚合；
- Clock、Schedule 和离线补算；
- 命令、领域事件和只读投影；
- 数据删除与导出基础。

### Stage B：Relationship Continuity

在 Stage A 稳定后实现：

- AI Provider 边界；
- Conversation 聚合；
- 记忆候选与用户管理；
- 日记生成；
- 人格一致性和安全评测。

### Stage C：Richer Home

在回访得到验证后实现：

- Bedroom、Kitchen、Garden 状态；
- 植物和纪念物投影；
- 更丰富但低频的 Buddy 动作；
- 季节和天气视觉，不引入经济系统。

### Stage D：Connected World Research

只有满足以下条件才进入立项：

- Home 的七日回访和关系连续性得到证据支持；
- 用户明确需要跨设备或分享；
- 账号、加密、审核、删除和未成年人边界已有方案；
- 服务端成本和故障不会损害私人 Home。

此阶段先验证加密备份或异步明信片，不直接建设实时 Town 或大型 World。

## 15. 世界功能评审门

任何新世界功能必须回答：

1. 它增强 Home、Buddy、时间、痕迹或远方中的哪一个主题？
2. 它改变了哪个聚合和哪些领域事件？
3. 它是否要求新的现实权限、账号或云端权威？
4. 离线和 AI 失败时，私人 Home 是否仍然完整？
5. 它是否引入惩罚、焦虑、竞争、经济或情感操控？
6. 用户能否理解、关闭、导出和删除相关数据？
7. 当前阶段是否有用户证据支持它？

无法明确回答的问题先进入研究池，不直接进入实现。

## 16. 下一步后端工作

基于本架构，下一项工程任务应为：

> 建立 Private Home Kernel：完成 SQLite 迁移基础、Buddy 聚合、确定性 Life Engine、领域事件事务写入，以及应用启动时的状态恢复。

首个垂直切片只覆盖：

```text
CreateBuddy
  → Persist Buddy + Initial State
  → AdvanceWorldTime
  → Change Activity
  → Persist State + Domain Event
  → Restart App
  → Restore The Same Buddy
```

该切片通过后，再接入真实 UI、Memory、Diary 和 AI Provider。
