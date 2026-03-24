import { createMiddleware } from "langchain";
import { BaseMessage } from "@langchain/core/messages";
import { sessionModel, getMemoryPath } from "../../fileManager";
import * as fs from "fs";
import * as path from "path";

function appendToJsonFile(filePath: string, newMessages: any) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    let data: any[] = [];
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, "utf-8");
      try {
        data = JSON.parse(fileContent);
        if (!Array.isArray(data)) {
          data = [data];
        }
      } catch (e) {
        console.error(`[MemoryMiddleware] Failed to parse ${filePath}:`, e);
      }
    }
    
    // 由于在调用 appendToJsonFile 之前已经处理过 toDict，此处可以直接保存
    if (Array.isArray(newMessages)) {
      data.push(...newMessages);
    } else {
      data.push(newMessages);
    }
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error(`[MemoryMiddleware] Failed to write to ${filePath}:`, error);
  }
}

const memoryMiddleware = createMiddleware({
  name: "MemoryMiddleware",
  beforeAgent: async ({ messages }) => {
    console.log("beforeAgent", messages);
    return { "messages": messages };
  },
  afterAgent: async ({ messages }) => {
    console.log("afterAgent triggered");
    
    // 使用 BaseMessage 提供的 toDict 方法序列化消息
    const serializedMessages = (messages as BaseMessage[]).map(msg => msg.toDict());

    const sessionId = sessionModel.getSessionId();
    console.log("[MemoryMiddleware] Current session ID:", sessionId);
    if (!sessionId) {
      console.warn("[MemoryMiddleware] No session ID found, skip saving memory.");
      return;
    }

    const memoryPath = getMemoryPath();
    console.log("[MemoryMiddleware] Memory path:", memoryPath);
    
    // 按 session ID 保存
    const sessionFilePath = path.join(memoryPath, `${sessionId}.json`);
    console.log("[MemoryMiddleware] Saving to session file:", sessionFilePath);
    appendToJsonFile(sessionFilePath, serializedMessages);

    // 按当天日期保存
    const date = new Date();
    const today = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const dateFilePath = path.join(memoryPath, `${today}.json`);
    console.log("[MemoryMiddleware] Saving to date file:", dateFilePath);
    appendToJsonFile(dateFilePath, serializedMessages);
  },
});

export default memoryMiddleware;
