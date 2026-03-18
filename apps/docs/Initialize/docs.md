# docs 应用初始化

## 项目初始化

1. 创建应用目录

```bash
mkdir apps/docs
```

2. 初始化应用项目

```bash
cd apps/docs
pnpm init
```

3. 安装 Vitepress

```bash
pnpm add -D vitepress@next
```

4. 启动安装向导

```bash
pnpm vitepress init
# 一路回车（enter）即可
┌  Welcome to VitePress!
│
◇  Where should VitePress initialize the config?
│  ./docs
│
◇  Where should VitePress look for your markdown files?
│  ./docs
│
◇  Site title:
│  My Awesome Project
│
◇  Site description:
│  A VitePress Site
│
◇  Theme:
│  Default Theme
│
◇  Use TypeScript for config and theme files?
│  Yes
│
◇  Add VitePress npm scripts to package.json?
│  Yes
│
◇  Add a prefix for VitePress npm scripts?
│  Yes
│
◇  Prefix for VitePress npm scripts:
│  docs
│
└  Done! Now run pnpm run docs:dev and start writing.
```

## 配置 GitHub Pages

1. 编辑 `docs/.vitepress/config.mts`

```typescript
import { defineConfig } from "vitepress";

export default defineConfig({
  base: "/browserclaw/", // 这里的路径是配置站点部署的公共基础路径
  ignoreDeadLinks: true,  // VitePress打包极其严格，如果链接不存在会打包报错，前期先忽略，等项目完善后再开启
  title: "BrowserClaw Docs",
  description: "BrowserClaw 是一个个人专属浏览器AI助手",
});
```

2. 提交代码到 GitHub 仓库

```bash
git add .
git commit -m "Add VitePress config"
git push
```

3. 在 GitHub 仓库设置 GitHub Pages

- 仓库设置 -> Pages -> `Build and deployment` -> `Source`选择 `GitHub Actions`
