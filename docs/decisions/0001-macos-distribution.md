# ADR-0001：macOS MVP 采用直接分发

- 状态：Proposed，等待 Phase 0 验证
- 日期：2026-08-09

## 背景

OneShow Home 的核心体验需要透明桌面小屋窗口。Tauri v2 官方配置说明指出，macOS 透明窗口需要启用 `macos-private-api`，使用该私有 API 会使应用无法被 Mac App Store 接受。

参考：

- [Tauri v2 WindowConfig](https://v2.tauri.app/reference/config/#windowconfig)
- [Tauri macOS 应用打包](https://v2.tauri.app/distribute/macos-application-bundle/)
- [Apple Developer ID](https://developer.apple.com/support/developer-id/)
- [Apple 软件公证](https://developer.apple.com/documentation/security/notarizing-macos-software-before-distribution)

## 决策

MVP 暂定通过官网或受控下载渠道直接分发：

- 使用 Developer ID 签名；
- 启用 hardened runtime；
- 提交 Apple 公证；
- 分发经过公证的 `.app`、DMG 或 ZIP；
- 不以 Mac App Store 审核为 MVP 完成条件。

## 后果

正面：

- 可以保留透明桌面小屋体验；
- 发布节奏不依赖 App Store 审核；
- 可以使用适合桌面陪伴产品的窗口行为。

负面：

- 需要 Apple Developer Program、签名和公证流程；
- 用户需要从站外下载安装；
- 自动更新、安全告知和下载可信度需要自行建设；
- 暂时失去 Mac App Store 分发能力。

## 替代方案

1. 放弃完全透明窗口，使用普通窗口或菜单栏弹窗；
2. 构建 App Store 与直接分发两个变体；
3. 使用原生 AppKit 重做窗口层并重新评估审核可行性。

## 复审条件

- Phase 0 发现透明窗口体验无法稳定实现；
- Tauri 或 Apple 政策变化；
- App Store 成为关键获客渠道；
- 原生窗口实现能够在不使用私有 API 的情况下满足体验。
