# zrocclaw CLI

ZrocClaw 官方命令行工具，用于快速启动和管理你的专属浏览器 AI 助手后台服务。

## 简介

本工具提供了简易的命令，底层依赖 `pm2` 来守护后台进程，帮助你一键启动、停止、或更新 ZrocClaw 服务。

## 前置条件

在安装 CLI 工具前，请确保您的系统满足以下要求：

- **Node.js**: 版本需 **>= 22.0.0**。
- **包管理器**: `npm` 或 `pnpm`。
- **浏览器**: 需本地安装 **Google Chrome** 或 Chromium 浏览器（以支持 ZrocClaw 后台的浏览器自动化操作）。

## 安装

推荐进行全局安装，以便在任何终端路径下均可执行：

```bash
npm install -g zrocclaw
```

## 使用说明

安装完成后，你可以通过 `zrocclaw` 命令来管理后台服务。

### 启动服务

```bash
zrocclaw start
```
该命令会使用 PM2 在后台启动 ZrocClaw 网关服务。启动成功后，你可以通过以下地址访问服务：
- 💬 **对话界面**: [http://127.0.0.1:18302/web/#/chat](http://127.0.0.1:18302/web/#/chat)
- 🔍 **健康检查**: [http://127.0.0.1:18302/health](http://127.0.0.1:18302/health)

### 停止服务

```bash
zrocclaw stop
```
当你不再需要使用 ZrocClaw，或者需要彻底关闭后台驻留的服务时，可以运行该命令。它会停止并清理对应的 PM2 进程记录。

### 更新版本

```bash
zrocclaw update
```
一键将全局安装的 `zrocclaw` 更新到最新版本。

## 常见问题与日志排查

如果启动失败或服务运行异常，ZrocClaw 的 PM2 日志会默认输出到你的用户目录下，方便排查：
- 运行日志：`~/.zrocclaw/log/pm2out.log`
- 错误日志：`~/.zrocclaw/log/pm2err.log`
