以下是使用 **pnpm + Node.js + TypeScript + Express** 构建网关项目的详细步骤。我们将搭建一个基础网关，包含路由转发、静态文件服务、环境配置和开发热重启。

---

## 1. 初始化项目目录与 `package.json`

```bash
# 创建项目文件夹
mkdir my-gateway
cd my-gateway

# 使用 pnpm 初始化（生成 package.json）
pnpm init
```

按提示填写项目信息，或直接回车使用默认值。

---

## 2. 安装生产依赖

网关核心依赖：`express` 框架，`http-proxy-middleware` 用于反向代理，`dotenv` 加载环境变量。

```bash
pnpm add express http-proxy-middleware dotenv
```

---

## 3. 安装开发依赖

TypeScript 及相关类型定义、开发工具。

```bash
pnpm add -D typescript @types/node @types/express @types/http-proxy-middleware ts-node nodemon
```

- `typescript`: TypeScript 编译器
- `@types/node`: Node.js 类型定义
- `@types/express`: Express 类型定义
- `@types/http-proxy-middleware`: 代理中间件类型定义
- `ts-node`: 直接运行 TypeScript 文件（开发用）
- `nodemon`: 监听文件变化自动重启（可选，但推荐）

---

## 4. 初始化 TypeScript 配置

生成 `tsconfig.json`：

```bash
npx tsc --init
```

然后根据项目需求修改配置，推荐以下内容：

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

## 5. 创建项目目录结构

```
my-gateway/
├── src/
│   ├── middlewares/        # 自定义中间件
│   ├── routes/             # 路由定义
│   ├── config/             # 配置加载
│   ├── app.ts              # Express 应用初始化
│   └── server.ts           # 服务启动入口
├── .env.example            # 环境变量示例
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

执行命令创建目录：

```bash
mkdir -p src/{middlewares,routes,config}
touch src/app.ts src/server.ts .env.example
```

---

## 6. 编写配置文件 (环境变量)

在 `.env.example` 中写入示例配置：

```env
PORT=3000
NODE_ENV=development

# 后端服务地址
WEB_APP_URL=http://localhost:5173        # Vue 开发服务器地址
AGENT_SERVICE_URL=http://localhost:8080  # 智能体服务地址
```

复制一份用于开发：

```bash
cp .env.example .env
```

---

## 7. 编写应用入口 `app.ts`

```typescript
// src/app.ts
import express from 'express';
import cors from 'cors';                // 可选，如果需要跨域
import helmet from 'helmet';            // 可选，安全头
import { createProxyMiddleware } from 'http-proxy-middleware';
import dotenv from 'dotenv';

dotenv.config(); // 加载 .env 文件

const app = express();

// 基础中间件
app.use(helmet());                      // 安全相关
app.use(cors());                        // 允许跨域
app.use(express.json());                // 解析 JSON 请求体

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 静态文件服务：将 Vue 打包后的 dist 目录挂载到根路径
// 注意：生产环境才使用静态文件服务，开发时通常由 Vite 自己处理
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('public'));    // 假设 Vue 构建产物放在 public 文件夹
}

// 反向代理配置
// 将 /api/* 转发到智能体服务
app.use(
  '/api',
  createProxyMiddleware({
    target: process.env.AGENT_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
      '^/api': '',                      // 移除 /api 前缀，根据后端实际接口调整
    },
    onError: (err, req, res) => {
      console.error('Proxy error:', err);
      res.status(500).json({ error: 'Proxy service unavailable' });
    },
  })
);

// 开发环境下，可以将非 API 请求代理到 Vite 开发服务器
if (process.env.NODE_ENV === 'development') {
  app.use(
    '/',
    createProxyMiddleware({
      target: process.env.WEB_APP_URL,
      changeOrigin: true,
      ws: true,                         // 支持 WebSocket (用于 Vite HMR)
    })
  );
}

export default app;
```

**注意**：这里为了演示简单，直接写在了 `app.ts`。实际项目可将路由拆分到 `routes/` 目录。

---

## 8. 编写服务启动文件 `server.ts`

```typescript
// src/server.ts
import app from './app';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Gateway is running at http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});
```

---

## 9. 配置开发与构建脚本

修改 `package.json` 的 `scripts` 部分：

```json
{
  "scripts": {
    "dev": "nodemon src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "clean": "rm -rf dist"
  }
}
```

同时需要配置 `nodemon` 以支持 TypeScript 运行。在项目根目录创建 `nodemon.json`：

```json
{
  "watch": ["src"],
  "ext": "ts,json",
  "ignore": ["src/**/*.spec.ts"],
  "exec": "ts-node src/server.ts"
}
```

---

## 10. 测试运行

```bash
pnpm run dev
```

访问 `http://localhost:3000/health` 应看到 JSON 响应。  
根据你的后端服务是否启动，可以测试代理是否工作（例如 `http://localhost:3000/api/some-endpoint`）。

---

## 11. 构建生产版本

```bash
pnpm run build
```

这会在 `dist/` 目录生成编译后的 JavaScript 文件。然后运行：

```bash
pnpm run start
```

确保生产环境设置了正确的环境变量（通过 `NODE_ENV=production` 和 `.env` 文件或系统环境变量）。


如果需要手动杀死网关进程，执行以下命令：
```bash
pnpm run build
node dist/server.js

lsof -i:3000
# 输出
# COMMAND  PID USER   FD   TYPE DEVICE SIZE/OFF NODE NAME
# node     12345 zroc   13u  IPv4  12345      0t0  TCP *:3000 (LISTEN)
kill -9 12345
```


---

## 12. （可选）添加更多功能

- **日志**：集成 `morgan` 中间件记录请求。
- **请求限流**：使用 `express-rate-limit`。
- **认证中间件**：在 `src/middlewares/auth.ts` 中编写 JWT 验证逻辑，并应用到需要保护的路由。
- **路由模块化**：将代理配置移到 `routes/proxy.ts`，使用 `app.use()` 挂载。

---

## 13. 在 monorepo 中的集成（可选）

如果你已经有一个 pnpm monorepo，可以将此网关作为一个独立的 package 放在 `apps/gateway` 下，并在根目录的 `pnpm-workspace.yaml` 中声明：

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

然后在网关目录下执行上述步骤即可。可以通过 `pnpm` 的过滤命令来操作：`pnpm --filter gateway ...`。

---

## 总结

你现在拥有了一个基于 pnpm、Node.js、TypeScript 和 Express 的网关项目骨架。它能够：

- 加载环境变量
- 提供健康检查
- 代理 API 请求到后端服务
- 在开发时代理前端开发服务器
- 支持 TypeScript 开发体验（热重启、类型检查）

根据实际业务需求，你可以进一步扩展中间件、增加路由规则、集成服务发现等。