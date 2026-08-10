# macOS 本地模型运行时

## 产品行为

OneShow Home 支持两种 Buddy 模型来源：

1. `OneShow 官方模型`：经 `oneshowhome.com/api` 使用 Admin 配置的模型；
2. `这台 Mac 的本地模型`：App 的 Rust 原生层直接调用 localhost，不经过 OneShowHome 服务器。

用户可以在 Home 右侧选择“设置”，进入“Buddy 的大脑”完成切换。每次启用本地模型前必须通过连接测试。

## 支持的运行器

### Ollama

1. 安装并启动 Ollama；
2. 下载一个对话模型，例如 `ollama pull qwen3:8b`；
3. 保持 `ollama serve` 运行；
4. 在 OneShow Home 选择 Ollama；
5. 默认地址为 `http://127.0.0.1:11434/v1`；
6. 模型 ID 可以留空，由 App 选择第一个已加载模型。

### LM Studio

1. 在 LM Studio 中下载并加载模型；
2. 打开 Developer / Local Server；
3. 启动 OpenAI-compatible 服务；
4. 在 OneShow Home 选择 LM Studio；
5. 默认地址为 `http://127.0.0.1:1234/v1`。

## 安全边界

- 本地模式只允许 `http://127.0.0.1`、`http://localhost` 和 `http://[::1]`；
- 拒绝局域网、公网、带账号密码、查询参数或重定向的地址；
- 请求由 Rust 发出，不受 WebView CORS 影响；
- 本地对话保存在 App 本地存储，不上传服务器；
- 切回官方模型不会自动上传本地对话；
- 本地连接失败时不会把同一条消息静默转发给官方模型。

## OpenAI-compatible 契约

运行器需要实现：

- `GET /v1/models`；
- `POST /v1/chat/completions`；
- 非流式 `choices[0].message.content` 响应。

请求最长等待 60 秒，响应上限为 2 MiB；最多发送最近 24 条本地消息。

## 后续能力

- 将本地对话从 WebView 存储迁移到本地 SQLite；
- 允许用户管理多套本地模型预设；
- 增加本地 embedding 和记忆提取；
- 支持模型速度、上下文窗口和内存占用检测；
- 在明确授权后，允许局域网内的家庭推理服务器。
