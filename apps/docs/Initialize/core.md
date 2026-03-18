# 核心功能

## core 应用初始化
1. 创建目录
```bash
mkdir packages/core
cd packages/core
```

2. 基于 Vite 初始化核心库
```bash
pnpm create vite
│
◇  Project name:
│  core
│
◇  Select a framework:
│  Vanilla
│
◇  Select a variant:
│  TypeScript
│
◇  Install with pnpm and start now?
│  No
│
◇  Scaffolding project in xxx/packages/core...
│
└  Done. Now run:

  cd core
  pnpm install
  pnpm dev
```
3. 配置 Vite 构建,新增文件`vite.config.ts`
```typescript
import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
	build: {
		lib: {
			entry: path.resolve(__dirname, "src/index.ts"),
			name: "@browserclaw/core",
			fileName: "@browserclaw/core",
		},
	},
});
```

## 初始化项目目录
```
packages/core
├── src
│   ├── agents
│   ├── playwright
│   └── index.ts
├── package.json
├── tsconfig.json
└── vite.config.ts
```


