# 核心库开发

## 初始化

1. 初始化核心库
```bash
cd packages
mkdir core
cd core
pnpm init 
```
2. 配置package.json并执行`pnpm install`
```json
{
  "name": "@zrocclaw/core",
  "version": "0.0.1",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "default": "./dist/index.js"
    },
    "./playwright": {
      "types": "./dist/playwright/index.d.ts",
      "import": "./dist/playwright/index.mjs",
      "require": "./dist/playwright/index.js",
      "default": "./dist/playwright/index.js"
    },
    "./fileManager": {
      "types": "./dist/fileManager/index.d.ts",
      "import": "./dist/fileManager/index.mjs",
      "require": "./dist/fileManager/index.js",
      "default": "./dist/fileManager/index.js"
    },
    "./agents": {
      "types": "./dist/agents/index.d.ts",
      "import": "./dist/agents/index.mjs",
      "require": "./dist/agents/index.js",
      "default": "./dist/agents/index.js"
    }
  },
  "scripts": {
    "dev": "tsup --watch",
    "build": "tsup"
  },
  "dependencies": {
    "@langchain/core": "^1.1.34",
    "@langchain/langgraph": "^1.2.4",
    "@langchain/openai": "^1.3.0",
    "langchain": "^1.2.35",
    "playwright": "^1.58.2",
    "zod": "^4.3.6"
  },
  "devDependencies": {
    "@types/node": "^25.5.0",
    "tsup": "^8.5.1",
    "typescript": "~5.9.3"
  }
}

```
3. 配置 tsup 构建
```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/playwright/index.ts',
    'src/fileManager/index.ts',
    'src/agents/index.ts'
  ],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  // tsup 默认会将 package.json 中的 dependencies 自动作为 external 处理
  // 不需要像 vite 那样手动配置内置模块或第三方依赖
});


```

## 初始化项目目录
```
packages/core
├── src
│   ├── xxxxx
│   └── index.ts
├── package.json
├── tsconfig.json
└── vite.config.ts
```
## 必要性分析
          
根据对你当前仓库架构（特别是 `apps/gateway` 和 `apps/cli` 的构建与运行机制）的深入分析，**结论是：`types` 和 `require` 都是必不可少的，不建议移除。当前 `esm` + `cjs`（双格式）配合完整 `exports` 的配置是目前最稳健、最符合当前架构的选择。**

如果仅仅打 `es` 或者 `umd` 格式的包，会导致 `gateway` 项目在**本地开发类型推导**和**运行时**都出现严重的阻断问题。

以下是具体的分析依据：

### 1. 为什么 `types` 绝对不能删？
在 [apps/gateway/tsconfig.json](file:///Users/zroc/Desktop/Zroc/AI/zrocclaw/apps/gateway/tsconfig.json) 中，你配置了 `"moduleResolution": "Node16"`：
```json
"module": "Node16",
"moduleResolution": "Node16",
```
在 `Node16` 解析模式下，TypeScript 编译器**强依赖** `package.json` 中的 `exports` 字段。如果你从 `exports` 中删除了 `"types"`：
- 当 `gateway` 引入类似 `import { ... } from '@zrocclaw/core/playwright'` 时，TypeScript 将不知道去哪里寻找对应的 `.d.ts` 类型声明。
- 此时编辑器和构建阶段都会直接报错 `Cannot find module '@zrocclaw/core/playwright' or its corresponding type declarations.`。
- **结论**：为了让引入方（如 `gateway`）获得正确的 TS 类型提示和编译通过，`types` 字段必须保留。

### 2. 为什么 `require` (CommonJS) 不能删？
你可能觉得项目都是用 `import/export` 写的，所以只需要 `esm` 即可，但我们需要看引入方是如何**运行**代码的：
- **本地开发阶段**：通过查看 [apps/gateway/nodemon.json](file:///Users/zroc/Desktop/Zroc/AI/zrocclaw/apps/gateway/nodemon.json)，`gateway` 的开发脚本是 `ts-node src/server.ts`。因为 `gateway/package.json` 中没有声明 `"type": "module"`，所以 `ts-node` 是在 **CommonJS 环境** 下运行的。它会在内存中把你的 `import` 动态编译成 `require()` 调用。如果 `core` 包只提供 `esm` 格式并删除了 `require` 导出，Node.js 遇到 `require('@zrocclaw/core')` 时会直接抛出大名鼎鼎的 `ERR_REQUIRE_ESM` 崩溃报错。
- **构建生产阶段**：通过查看 [apps/gateway/tsup.config.ts](file:///Users/zroc/Desktop/Zroc/AI/zrocclaw/apps/gateway/tsup.config.ts)，`gateway` 的生产构建目标格式是 `format: ['cjs']`，且通过 `noExternal` 将 `core` 包打入最终产物中。`tsup` 在打包为 CJS 时，如果能直接抽取 `core` 的 `cjs` 产物，也是最兼容不易出错的做法。

### 3. 只打 ESM 或 UMD 满足需求吗？
- **UMD 格式**：完全没必要。UMD 主要为了兼容老旧浏览器环境通过 `<script>` 标签引入。`core` 包目前是给 Node.js 后端（Gateway / CLI）使用的，打 UMD 反而是浪费时间。
- **仅打 ESM 格式**：如果你铁了心只要 ESM，那么你需要付出极高的**重构成本**：
  1. 必须给 `apps/gateway` 和 `apps/cli` 的 `package.json` 都加上 `"type": "module"`。
  2. 把 `gateway` 所有本地相对路径引入全部加上 `.js` 后缀（如 `import { router } from './router.js'`）。
  3. 将本地开发的 `ts-node` 切换为 `ts-node --esm` 或者 `tsx`。
  综合来看，为了在 `core` 里面省掉一个轻量的 `cjs` 构建，而让应用层做全盘的 Pure ESM 改造，在当前的架构下属于“吃力不讨好”。

### 总结建议
你目前在 `packages/core` 中的 `package.json` (`exports`) 和 `tsup.config.ts` (`format: ['cjs', 'esm']`) 的配置，是标准的**现代 Node.js 库双包（Dual-Package）最佳实践**。它既完美支持了 TypeScript 的类型推导，又兼顾了当前 `gateway` 以 CommonJS 为主的运行环境，建议**保持原样，无需修改**。



## 智能体开发

```bash
pnpm add langchain @langchain/core @langchain/openai zod
pnpm add -D @types/node
```


## 浏览器自动化

```bash
pnpm add playwright
```

## 渠道接入

