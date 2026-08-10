# OneShowHome Backend Service

## 当前垂直切片

后端位于 `apps/api`，采用 Node.js、TypeScript 和 PostgreSQL。第一阶段支持：

- 匿名安装注册；
- Bearer 安装令牌鉴权；
- Buddy 资料读取与更新；
- 会话和消息持久化；
- 带最近对话上下文的 Buddy 模型调用；
- 存活与就绪探针；
- Admin 内部模型网关；
- 为记忆和 OSS 对象预留的数据表。

## HTTP 契约

| 方法 | 路径 | 鉴权 | 用途 |
| --- | --- | --- | --- |
| GET | `/health/live` | 无 | 进程存活 |
| GET | `/health/ready` | 无 | 数据库可用 |
| POST | `/v1/installations` | 无、IP 限流 | 首次安装注册 |
| GET | `/v1/me` | 安装令牌 | 当前安装和 Buddy |
| PATCH | `/v1/buddy` | 安装令牌 | 更新名字、性格、头像引用 |
| POST | `/v1/chat` | 安装令牌、安装级限流 | 保存用户消息并返回 Buddy 回复 |

生产环境由 Nginx 将 `https://oneshowhome.com/api/*` 转发至本机 API，并移除 `/api` 前缀。

## 数据模型

- `installations`：匿名安装主体和令牌摘要；
- `buddy_profiles`：每个安装一个 Buddy 聚合根；
- `conversations`：安装拥有的对话；
- `chat_messages`：用户与 Buddy 消息、模型和 Token 用量；
- `memories`：后续由记忆提取任务写入；
- `object_assets`：OSS 对象元数据，不保存访问密钥。

## 模型路由

生产优先使用 `ONESHOW_HOME_MODEL_GATEWAY_URL` 和服务令牌。OneShowTools Admin 中的 `oneshow_home_chat` 是独立模型用途，可以单独测试、启用和停用。

仅本地联调允许通过 `ONESHOW_HOME_CHAT_BASE_URL`、`ONESHOW_HOME_CHAT_API_KEY` 和 `ONESHOW_HOME_CHAT_MODEL` 直连 OpenAI-compatible 接口。直连密钥仍只能位于服务端环境变量。

## OSS 边界

普通聊天、Buddy 状态和记忆写 PostgreSQL，不写 OSS。OSS 用于体积较大的二进制对象：

- 自定义 Buddy 头像；
- 相册图片；
- 语音消息；
- 日记导出文件。

后续上传流程使用短时上传意图或服务端代理，客户端永远不获得 OSS AccessKey。

## 本地命令

```bash
pnpm --filter @oneshow/api typecheck
pnpm --filter @oneshow/api test
pnpm --filter @oneshow/api build
```

复制 `apps/api/.env.example` 到工作区外的安全位置，填入本地测试配置后运行：

```bash
pnpm dev:api
```
