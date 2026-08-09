# OneShow Home

OneShow Home 是一款住在 macOS 桌面里的数字陪伴产品。用户拥有一个持续存在、有生活状态并逐渐形成记忆的 Buddy。

> 不是一个等待指令的 AI 助手，而是一个住在用户电脑里的数字生命。

## 当前阶段

项目处于 macOS Local MVP 的产品与技术基线阶段。

当前优先级：

1. 验证透明桌面小屋的 macOS 窗口体验；
2. 完成不依赖 AI 的 Buddy 垂直切片；
3. 增量加入聊天、记忆和日记；
4. 完成签名、公证和外部测试版本。

暂不开发多人社交、Town、World、经济、商店、支付、云同步和多 Buddy。

## 产品文档

- [产品基线](docs/product/product-foundation.md)：定位、用户、核心循环、原则和成功指标；
- [MVP 产品规格](docs/product/mvp-spec.md)：范围、流程、功能和验收标准；
- [体验与内容规范](docs/product/experience-guidelines.md)：概念、视觉、动画、文案和主动行为；
- [产品路线图](docs/product/roadmap.md)：Phase 0–3 阶段门和退出条件。

## 工程文档

- [技术架构](docs/engineering/architecture.md)：模块边界、目录、状态引擎和数据模型；
- [安全、隐私与陪伴边界](docs/engineering/security-and-privacy.md)；
- [研发流程与质量规范](docs/engineering/development-workflow.md)；
- [贡献指南](CONTRIBUTING.md)；
- [架构决策记录](docs/decisions/)。

## 技术方向

```text
Tauri v2 + React + TypeScript + Rust + SQLite
```

- macOS 14+、Apple Silicon 优先；
- 本地优先，核心体验不依赖在线服务；
- AI Provider 可替换，用户密钥进入安全存储；
- Buddy Life Engine 与 React、Tauri 和具体模型解耦；
- MVP 暂定采用 Developer ID 签名、公证并直接分发。

## 本地开发

环境要求：

- macOS 14 及以上；
- Node.js 22 及以上；
- pnpm；
- Rust stable，包含 `rustfmt` 和 `clippy`；
- Apple Command Line Tools。

```bash
pnpm install
pnpm verify
pnpm dev
```

生成本地 macOS `.app`：

```bash
pnpm build:app
```

当前验证结果与人工验收项目见 [Phase 0 技术验证记录](docs/engineering/phase-0-validation.md)。

## 开发约定

- `main` 始终保持可构建、可发布；
- 使用 `feature/`、`fix/`、`docs/`、`refactor/`、`chore/` 分支；
- 使用 Conventional Commits；
- 不提交密码、密钥、令牌、用户数据或本地 `.env`；
- 合并前完成格式、类型、测试、安全和生产构建验证；
- 不增加当前 Phase 之外的功能。

开始开发前请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。
