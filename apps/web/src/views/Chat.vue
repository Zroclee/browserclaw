<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import Header from '../components/Chat/Header.vue';
import Bubble from '../components/Chat/Bubble.vue';
import Input from '../components/Chat/Input.vue';
import request from '../api/request';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  loading?: boolean;
}

// 状态
const messages = ref<Message[]>([]);
const inputValue = ref('');
const isGenerating = ref(false);
const messageListRef = ref<HTMLElement | null>(null);
const abortController = ref<AbortController | null>(null);

// 生成唯一 ID
const generateId = () => crypto.randomUUID();

const curChatId = ref(''); // 每个会话生成一个唯一 ID

// 滚动到底部
const scrollToBottom = async () => {
  await nextTick();
  if (messageListRef.value) {
    messageListRef.value.scrollTop = messageListRef.value.scrollHeight;
  }
};

// 关闭 SSE
const closeSSE = () => {
  if (abortController.value) {
    abortController.value.abort();
    abortController.value = null;
  }
  isGenerating.value = false;
};

// 获取或创建会话 ID
const fetchSessionId = async (isNew: boolean = false) => {
  try {
    const params = isNew ? { new: true } : {};
    const data: any = await request.get('/chat/session', { params });
    
    if (data.sessionId) {
      curChatId.value = data.sessionId;
    } else {
      curChatId.value = generateId();
    }
  } catch (error) {
    console.error('获取会话ID失败:', error);
    curChatId.value = generateId(); // 回退方案
  }
};

// 获取历史记录
const fetchHistory = async () => {
  if (!curChatId.value) return;
  try {
    const res: any = await request.post('/chat/history', { sessionId: curChatId.value });
    if (res && Array.isArray(res.data)) {
      messages.value = res.data;
      scrollToBottom();
    }
  } catch (error) {
    console.error('获取历史记录失败:', error);
  }
};

// 添加历史记录
const addHistoryItem = async (msg: Message) => {
  if (!curChatId.value) return;
  try {
    await request.post('/chat/history/add', {
      sessionId: curChatId.value,
      ...msg
    });
  } catch (error) {
    console.error('添加历史记录失败:', error);
  }
};

// 发起真实流式请求
const connectSSE = async (query: string) => {
  if (abortController.value) {
    console.log("SSE 已存在，请勿重复创建");
    return;
  }

  isGenerating.value = true;
  abortController.value = new AbortController();
  
  // 1. 创建 AI 消息占位
  const aiMessageId = generateId();
  const aiMessage = {
    id: aiMessageId,
    role: 'assistant' as const,
    content: "",
    loading: true,
  };
  messages.value.push(aiMessage);
  scrollToBottom();

  // 提前在外部获取响应式引用（注意：JS 数组不支持 [-1]，使用 length - 1）
  const currentMsg = messages.value[messages.value.length - 1];

  const baseURL = import.meta.env.DEV ? '/api' : '';
  const url = `${baseURL}/chat/stream`;
  console.log("🔗 连接 SSE:", url);

  try {
    await fetchEventSource(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: query,
        thread_id: curChatId.value
      }),
      signal: abortController.value.signal,
      onopen(response) {
        if (response.ok) {
          console.log("✅ SSE 连接已建立");
          return Promise.resolve();
        }
        return Promise.reject(new Error(`请求失败: ${response.status}`));
      },
      onmessage(event) {
        try {
          const data = JSON.parse(event.data);

          // 收到消息后取消 loading 状态
          if (currentMsg.loading) {
            currentMsg.loading = false;
          }

          switch (data.event_type) {
            case "llm_start":
              console.log("🤖 AI 开始生成:", data.content);
              break;
            case "llm_content":
              currentMsg.content += data.content;
              break;
            case "llm_end":
              console.log("✅ 大模型生成完成");
              break;
            case "tool_call_start":
              console.log("🔧 调用工具:", data.tool_name, data.tool_args);
              currentMsg.content += `\n\n> 正在调用工具: ${data.tool_name}...\n`;
              break;
            case "tool_output":
              console.log("📤 工具返回:", data.content);
              break;
            case "tool_call_end":
              console.log("✅ 工具调用完成");
              break;
            case "stream_end":
              console.log("🏁 流结束:", data.content);
              closeSSE();
              addHistoryItem(currentMsg);
              break;
            case "error":
              console.error("❌ 错误:", data.content);
              currentMsg.content += `\n\n[出错: ${data.content}]`;
              closeSSE();
              addHistoryItem(currentMsg);
              break;
            default:
              break;
          }
          scrollToBottom();
        } catch (error) {
          console.error("❌ 解析 SSE 数据失败:", error, "Raw data:", event.data);
          closeSSE();
        }
      },
      onclose() {
        console.log("🏁 SSE 连接关闭");
        closeSSE();
      },
      onerror(err) {
        console.error("❌ SSE error:", err);
        if (currentMsg.loading) {
          currentMsg.loading = false;
          currentMsg.content += "（连接中断）";
        }
        closeSSE();
        throw err; // 防止 fetchEventSource 自动重连
      }
    });
  } catch (err) {
    console.error("Fetch SSE 发生异常", err);
    closeSSE();
  }
};

// 开启新对话
const startNewChat = async () => {
  if (isGenerating.value) {
    closeSSE();
  }
  messages.value = [];
  inputValue.value = '';
  await fetchSessionId(true);
};

// 提交消息处理
const handleSubmit = async (text: string) => {
  if (!text.trim() || isGenerating.value) return;

  // 1. 添加用户消息
  const userMsgId = generateId();
  const userMsg: Message = {
    id: userMsgId,
    role: 'user',
    content: text
  };
  messages.value.push(userMsg);
  addHistoryItem(userMsg);
  
  inputValue.value = ''; // 清空输入框
  scrollToBottom();
  
  // 2. 发起 SSE 请求
  await connectSSE(text);
};

// 初始化欢迎消息
onMounted(async () => {
  await fetchSessionId();
  await fetchHistory();
});


</script>

<template>
  <div class="flex flex-col h-screen bg-base-200">
    <!-- 头部 -->
    <Header 
      title="ZrocClaw Chat" 
      @logo-click="console.log('logo clicked')" 
      @title-click="console.log('title clicked')"
    >
      <template #actions>
        <button class="btn btn-ghost btn-sm btn-circle" @click="$router.push('/config')" title="前往配置">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </template>
    </Header>

    <!-- 消息列表区 -->
    <div 
      ref="messageListRef"
      class="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
    >
      <Bubble
        v-for="msg in messages"
        :key="msg.id"
        :content="msg.content"
        :loading="msg.loading"
        :align="msg.role === 'user' ? 'right' : 'left'"
      >
        <template #top>
          {{ msg.role === 'user' ? 'You' : 'ZrocClaw' }}
        </template>
      </Bubble>
    </div>

    <!-- 输入区 -->
    <div class="bg-base-100 border-t border-base-300 p-4 shrink-0">
      <div class="max-w-4xl mx-auto">
        <Input
          v-model="inputValue"
          :autosize="{ minRows: 1, maxRows: 6 }"
          :loading="isGenerating"
          :disabled="isGenerating"
          autofocus
          placeholder="给 ZrocClaw 发送消息... (按 Enter 发送，Shift + Enter 换行)"
          @submit="handleSubmit"
        >
          <!-- 这里可以演示使用 extra 插槽放置一些辅助按钮，如上传图片等 -->
          <template #extra>
             <button class="btn btn-ghost btn-xs btn-circle text-base-content/50" title="新对话" @click="startNewChat">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
             </button>
          </template>
        </Input>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 自定义滚动条使其更美观 */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}
.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}
.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: var(--fallback-bc,oklch(var(--bc)/0.2));
  border-radius: 10px;
}
</style>
