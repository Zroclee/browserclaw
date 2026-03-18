# 初始化项目

## github
[browserclaw仓库地址] https://github.com/Zroclee/browserclaw

## Monorepo 初始化
1. 克隆项目
```bash
git clone https://github.com/Zroclee/browserclaw.git
cd browserclaw
```
2. pnpm 初始化
```bash
pnpm init
mkdir apps packages
echo "packages:
  - apps/*
  - packages/*" > pnpm-workspace.yaml
```
3. turbo 初始化
```bash
pnpm install turbo --global
pnpm add turbo --save-dev --workspace-root
```
4. 创建turbo.json并写入以下内容 （⚠️： 这里的任务依赖和输出物是根据Vite的默认配置来的，实际项目中可能需要根据具体情况调整。）（⚠️：如要复制JSON，要删掉注释）
```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      // 任务依赖：表示该任务的执行依赖于工作区内所有依赖包的`build`任务先完成。
      "dependsOn": ["^build"],
      // 输出物：定义哪些文件或目录的变化会影响缓存。这里参考Vite默认输出目录。
      "outputs": ["dist/**", ".vite/**"]
    },
    "dev": {
      // 开发服务器不需要缓存
      "cache": false
    },
    "lint": {
      // 代码检查任务的输出通常是控制台日志，可以缓存
      "outputs": []
    },
    "test": {
      // 测试任务可能依赖构建产物
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    }
  }
}
```

## 应用初始化

1. gateway 应用初始化
初始化过程请查看[gateway.md](gateway.md)
2. core 应用初始化
初始化过程请查看[core.md](core.md)



<!-- 3. 项目规划
- `apps` 目录：存放应用代码，每个应用都是一个独立的项目。
- `packages` 目录：存放共享代码，这些代码可以被多个应用使用。
其中
- `apps/gateway`：网关项目，负责实现网关的功能。
- `packages/core`：网关的核心代码，负责处理网关的业务逻辑。
- `packages/utils`：网关的工具代码，负责提供一些通用的工具函数。
- `packages/ui`：网关的 UI 代码，负责实现网关的用户界面。 -->
