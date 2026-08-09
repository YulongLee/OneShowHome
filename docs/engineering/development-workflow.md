# 研发流程与质量规范

## 1. 工作原则

- 先明确验收，再开始实现；
- 一个分支解决一个问题；
- 不在功能提交中混入无关重构；
- 领域规则必须可测试；
- 不绕过安全、迁移和发布检查追求演示速度；
- 任何 MVP 外功能先更新产品规格并经过确认。

## 2. 分支

- `main`：始终保持可构建、可发布；
- `feature/<short-name>`：功能；
- `fix/<short-name>`：缺陷；
- `docs/<short-name>`：文档；
- `refactor/<short-name>`：不改变行为的结构调整；
- `chore/<short-name>`：依赖、工具和基础设施。

禁止直接在 `main` 开发。正式协作后为 `main` 开启分支保护、必需检查和禁止强制推送。

## 3. Commit

采用 Conventional Commits：

```text
feat: add buddy state transition
fix: restore house position on second display
docs: define phase one acceptance criteria
refactor: isolate provider error mapping
test: cover offline state recovery
chore: update tauri dependencies
```

要求：

- 使用祈使语气描述完成的变化；
- 一次提交保持单一目的；
- 不提交密钥、生成缓存、个人配置或大体积无来源素材；
- 数据库结构变化必须与迁移一起提交；
- 行为变化必须包含测试或说明无法自动测试的原因。

## 4. Pull Request

PR 必须包含：

- 问题和目标；
- 实现范围与明确不包含内容；
- 验证方式；
- UI 变化截图或短视频；
- 数据库、权限、隐私和发布影响；
- 已知限制和回滚方式。

建议控制在可审查范围。大型功能先拆为不改变行为的基础提交和可独立验收的功能提交。

## 5. Definition of Ready

需求进入开发前应满足：

- 对应产品目标明确；
- 用户流程和异常状态明确；
- 验收标准可测试；
- 设计或素材已具备；
- 数据和权限影响已评估；
- 依赖和技术风险已识别；
- 不属于当前阶段的内容已排除。

## 6. Definition of Done

功能完成必须满足：

- 验收标准全部通过；
- TypeScript 类型检查、Lint、格式检查通过；
- 前端和 Rust 测试通过；
- 生产构建通过；
- 空、加载、失败、离线状态已处理；
- 键盘、Reduce Motion 和基本对比度已检查；
- 不新增未说明的网络请求和权限；
- 文档、迁移和决策记录同步更新；
- 无密钥、隐私数据或调试日志泄露；
- 在真实 Mac 完成与改动风险相称的验证。

## 7. CI 基线

每个 PR 至少运行：

1. 依赖锁定检查；
2. 格式检查；
3. Lint；
4. TypeScript 类型检查；
5. 前端单元测试；
6. Rust 格式和 Clippy；
7. Rust 测试；
8. Tauri 生产构建；
9. 秘密扫描。

发布工作流独立于普通 PR，签名和公证凭证只允许受保护环境访问。

## 8. 版本与发布

- 使用语义化版本；
- `0.x` 阶段允许快速演进，但数据库迁移仍需向前兼容；
- 每个发布版本包含变更说明、已知问题和测试矩阵；
- 发布前在干净用户环境验证安装、启动、升级、退出和卸载；
- 发布产物必须签名并按分发渠道完成 Apple 公证；
- 不使用开发者机器上的个人密码完成自动化签名。

## 9. 架构决策记录

影响以下内容的选择必须写入 `docs/decisions/`：

- 发布渠道；
- 窗口层级和私有 API；
- 数据存储；
- AI Provider 与密钥方案；
- 自动更新；
- 遥测；
- 新系统权限；
- 云同步或账号系统。

决策记录包含背景、选择、替代方案、后果和复审条件。

## 10. Issue 标签建议

- `phase:0`、`phase:1`、`phase:2`、`phase:3`；
- `area:desktop`、`area:buddy`、`area:data`、`area:ai`、`area:release`；
- `type:feature`、`type:bug`、`type:research`、`type:debt`；
- `priority:p0`、`priority:p1`、`priority:p2`；
- `risk:security`、`risk:privacy`、`risk:data-loss`。
