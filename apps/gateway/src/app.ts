// src/app.ts
import express from "express";
import cors from "cors"; // 可选，如果需要跨域
import helmet from "helmet"; // 可选，安全头
import configRouter from "./routes/config";
import chatRouter from "./routes/chat";
import dotenv from "dotenv";
import path from "path";

dotenv.config(); // 加载 .env 文件

const app = express();

// 基础中间件
app.use(helmet()); // 安全相关
app.use(cors()); // 允许跨域
app.use(express.json()); // 解析 JSON 请求体

// 健康检查端点
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// 配置路由
app.use("/config", configRouter);
app.use("/chat", chatRouter);

// 静态文件服务：将 Vue 打包后的 dist 目录挂载到根路径
// 注意：生产环境才使用静态文件服务，开发时通常由 Vite 自己处理
if (process.env.NODE_ENV === "production") {
  // 静态资源存放在 src/static（Web 构建后复制过来）
  app.use("/web", express.static(path.join(__dirname, "../src/static")));
}

export default app;
