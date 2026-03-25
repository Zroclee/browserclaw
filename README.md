# ZrocClaw

你的专属浏览器AI助手，具备自我学习生成技能的能力。

## 项目目的

本项目旨在打造一个属于你个人的浏览器 AI 助手，**模拟 OpenClaw 的核心能力**，为您提供一个可定制、可扩展、拥有本地化特征的私人智能终端。不仅支持日常对话问答，还能利用核心能力包（如 LangChain / Playwright）实现自我学习和生成技能。

## 快速开始

ZrocClaw 提供了便捷的命令行工具，支持一键安装与启停服务。详细的命令说明与日志排查请参考 [CLI 文档](./apps/cli/README.md)。

### 前置条件

在安装和使用 ZrocClaw 之前，请确保您的系统满足以下要求：

- **Node.js**: 版本需 **>= 22.0.0**。
- **包管理器**: `npm`（Node.js 自带）或 `pnpm`。
- **浏览器**: 需在本地安装 **Google Chrome** 或 Chromium 浏览器（用于支持底层 Playwright 浏览器自动化与自我学习能力）。

### 安装

推荐全局安装 ZrocClaw 命令行工具：

```bash
npm install -g zrocclaw
```

### 使用

安装完成后，你可以通过 `zrocclaw` 命令来管理后台服务：

- **启动服务**:
  ```bash
  zrocclaw start
  ```
  启动成功后，你可以通过以下地址访问服务：
  - 💬 **对话界面**: [http://127.0.0.1:18302/web/#/chat](http://127.0.0.1:18302/web/#/chat)
  - 🔍 **健康检查**: [http://127.0.0.1:18302/health](http://127.0.0.1:18302/health)

- **停止服务**:
  ```bash
  zrocclaw stop
  ```

- **更新版本**:
  ```bash
  zrocclaw update
  ```

## 项目架构

本项目采用 **pnpm + Turborepo** 驱动的 Monorepo 架构，以确保模块的解耦、复用和高效构建。主要目录职责如下：

### Apps (应用层)
- **`apps/cli`**: 命令行工具，提供便捷的终端命令以控制整个后台网关的启停和更新。
- **`apps/gateway`**: 网关服务，负责核心业务逻辑的处理、API 转发与健康检查等功能。
- **`apps/web`**: Web 前端客户端，为您提供一个直观、现代化的聊天交互界面。
- **`apps/docs`**: 官方文档站，提供项目的详细说明和开发指南。

### Packages (依赖包层)
- **`packages/core`**: 核心能力包，计划承载大模型交互（LangChain）、浏览器自动化（Playwright）等底层原子能力。
- **`packages/ui`**: 跨应用复用的公共 UI 组件库。

## 技术选型

- **包管理与构建**: pnpm, Turborepo, Vite, tsup
- **前端技术栈**: Vue 3 (组合式 API), TypeScript, TailwindCSS, daisyui
- **后端技术栈**: Node.js, Express, TypeScript
- **CLI与进程管理**: Commander.js, PM2
- **文档站点**: VitePress
