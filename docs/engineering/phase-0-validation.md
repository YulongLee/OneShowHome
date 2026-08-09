# Phase 0 macOS 技术验证记录

> 日期：2026-08-09
> 状态：本地工程验证完成，跨 Space 与全屏行为待人工验收

## 测试环境

- macOS 15.7.3；
- Apple Silicon `arm64`；
- Node.js 25.2.1；
- pnpm 11.16.0；
- Rust stable 1.97.1；
- Apple Command Line Tools 17.0；
- 未安装完整 Xcode；
- Tauri 2.11.x。

## 已实现

- `house` 透明、无边框独立窗口；
- `main` 普通主窗口；
- 菜单栏入口；
- 点击小屋调用原生命令打开并聚焦主窗口；
- 主窗口关闭时隐藏，应用继续运行；
- 菜单栏可以显示、隐藏小屋和退出应用；
- 小屋位于普通应用窗口下方；
- 小屋位置通过 Tauri Window State 插件保存；
- Window State 只跟踪 `house`，只保存位置，不恢复主窗口可见性；
- 白天和夜晚小屋外观使用本地时间切换；
- Reduce Motion 适配；
- 最小 Tauri capabilities 权限；
- QA 启动参数 `--show-main`，用于不依赖辅助权限的主窗口检查。

## 自动化结果

| 检查 | 结果 |
|---|---|
| Prettier | 通过 |
| ESLint | 通过，零警告 |
| TypeScript | 通过 |
| Vitest | 14/14 通过 |
| Rustfmt | 通过 |
| Clippy | 通过，警告视为错误 |
| Rust tests | 3/3 通过 |
| Vite production build | 通过 |
| Tauri release build | 通过 |
| macOS `.app` bundle | 通过 |

## 实机结果

### 透明桌面小屋

通过。成品 `.app` 启动后，`house` 窗口在 `(48, 90)` 以 `230 × 210` 显示；背景透明，小屋图像和夜间灯光正常。

### 窗口层级

通过基础验证。打开 `main` 时，小屋不会覆盖主窗口，符合“桌面存在但不遮挡工作”的方向。

### 主窗口

通过。使用 `--show-main` 启动成品应用后，主窗口在真实 WKWebView 中正常渲染为 `980 × 720`，标题栏、按钮、滚动区域和小屋预览正常。

### 打包

通过。仅使用 Apple Command Line Tools 即可生成本地未签名 `.app`：

```text
apps/desktop/src-tauri/target/release/bundle/macos/OneShow Home.app
```

## 待人工验证

以下行为高度依赖 macOS 当前 Space、显示器布局和系统权限，不应由自动化结果代替人工体验：

1. 将小屋拖到新位置，正常退出并重新打开，确认位置恢复；
2. 在多个桌面 Space 之间切换，确认小屋显示策略符合预期；
3. 打开全屏应用，确认小屋不覆盖全屏内容；
4. 连接和断开第二台显示器，确认小屋回到可见区域；
5. 系统睡眠和唤醒后确认窗口仍可交互；
6. 从菜单栏逐项验证打开 Home、显示小屋、隐藏小屋和退出。

## 已知限制

- macOS 透明窗口依赖 Tauri `macos-private-api`，不适用于 Mac App Store 分发；
- 当前 `.app` 未使用 Developer ID 签名或 Apple 公证，只用于本机开发测试；
- 正式签名、公证和 DMG 发布仍需要完整 Xcode、Apple Developer Program 与发布凭证；
- 系统未授予自动化工具辅助控制权限，因此真实点击、拖动、Space 和全屏操作保留为人工验收；
- Phase 0 不包含 Buddy、数据库、AI、开机启动或自动更新。

## 本地命令

```bash
pnpm install
pnpm verify
pnpm dev
pnpm build:app
```

直接显示主窗口进行 QA：

```bash
"apps/desktop/src-tauri/target/release/bundle/macos/OneShow Home.app/Contents/MacOS/oneshow-home" --show-main
```
