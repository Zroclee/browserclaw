import { ChatOpenAI } from "@langchain/openai";
import { createAgent, summarizationMiddleware } from "langchain";
import { HumanMessage } from "@langchain/core/messages";
import { MemorySaver, InMemoryStore } from "@langchain/langgraph";
// import memoryMiddleware from "./memory";
import { getCurrentTimeTool } from "./tools/common";
import {
  createFileTool,
  readFileTool,
  writeFileTool,
  deleteFileTool,
  listFilesTool,
} from "./tools/file_tool";
import {
  extractPageStateTool,
  executePlaywrightActionsTool,
} from "./tools/browser";
import { PLAYWRIGHT_PROMPT } from "./prompts/browser";
import { StreamEvent, StreamEventType } from "./stream";

interface ModelConfig {
  modelName: string;
  provider: string;
  apiKey: string;
  baseURL?: string;
}

const getModel = (modelConfig: ModelConfig) => {
  const model = new ChatOpenAI({
    modelName: modelConfig.modelName,
    apiKey: modelConfig.apiKey,
    configuration: {
      baseURL: modelConfig.baseURL,
    },
  });
  return model;
};

const checkpointer = new MemorySaver();
const store = new InMemoryStore();

const streamInvoke = async function* (
  query: string,
  thread_id: string,
  modelConfig: ModelConfig,
) {
  const model = getModel(modelConfig);
  const agent = createAgent({
    model: model,
    tools: [
      getCurrentTimeTool,
      createFileTool,
      readFileTool,
      writeFileTool,
      deleteFileTool,
      listFilesTool,
      extractPageStateTool,
      executePlaywrightActionsTool,
    ],
    systemPrompt: PLAYWRIGHT_PROMPT,
    middleware: [
      // memoryMiddleware,
      summarizationMiddleware({
        model: model,
        trigger: { tokens: 160000 },
        keep: { messages: 30 },
      }),
    ],
    checkpointer: checkpointer,
    store: store,
  });
  try {
    const stream = await agent.stream(
      { messages: [new HumanMessage(query)] },
      {
        streamMode: ["messages", "updates"],
        recursionLimit: 100,
        configurable: { thread_id: thread_id },
      },
    );
    for await (const [stream_mode, chunk] of stream) {
      if (stream_mode === "messages") {
        const [messageChunk, metadata] = chunk;
        const events = StreamEvent.fromMessageChunk(messageChunk, metadata);
        for (const event of events) {
          yield "data: " + event.toJson() + "\n\n";
        }
      }
      if (stream_mode === "updates") {
        // console.log('updates', chunk);
      }
    }
    yield "data: " + StreamEvent.createEndEvent() + "\n\n";
  } catch (error) {
    const errorEvent = new StreamEvent({
      event_type: StreamEventType.ERROR,
      content: `流式处理出错: ${String(error)}`,
      metadata: {
        error_type: error instanceof Error ? error.name : "UnknownError",
      },
    });
    yield "data: " + errorEvent.toJson() + "\n\n";
  }
};
export { streamInvoke };
