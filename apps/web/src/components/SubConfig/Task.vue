<template>
  <div class="p-4 space-y-4">
    <!-- 头部操作区 -->
    <div class="flex justify-between items-center">
      <h2 class="text-xl font-bold">定时任务配置</h2>
      <button class="btn btn-primary" @click="openModal('add')">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
        </svg>
        新增任务
      </button>
    </div>

    <!-- 任务列表表格 -->
    <div class="overflow-x-auto bg-base-100 rounded-box border border-base-200">
      <table class="table table-zebra w-full">
        <thead>
          <tr>
            <th>序号</th>
            <th>任务名称 (name)</th>
            <th>Cron 表达式</th>
            <th>任务消息 (message)</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="tasks.length === 0">
            <td colspan="6" class="text-center py-8 text-base-content/50">暂无任务数据</td>
          </tr>
          <tr v-for="(task, index) in tasks" :key="task.id">
            <td>{{ index + 1 }}</td>
            <td class="font-medium">{{ task.name }}</td>
            <td class="font-mono text-sm">{{ task.cron }}</td>
            <td class="max-w-xs truncate" :title="task.message">{{ task.message }}</td>
            <td>
              <input 
                type="checkbox" 
                class="toggle toggle-success toggle-sm" 
                :checked="task.isActive" 
                @change="toggleTaskStatus(task)" 
              />
            </td>
            <td>
              <div class="flex gap-2">
                <button class="btn btn-sm btn-outline btn-info" @click="openModal('edit', task)">编辑</button>
                <button class="btn btn-sm btn-outline btn-error" @click="confirmDelete(task)">删除</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 新增/编辑弹窗 -->
    <dialog id="task_modal" class="modal">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">{{ modalMode === 'add' ? '新增任务' : '编辑任务' }}</h3>
        
        <form @submit.prevent="handleSubmit">
          <div class="form-control w-full">
            <label class="label"><span class="label-text">任务名称 (name)</span></label>
            <input type="text" v-model="formData.name" placeholder="请输入任务名称" class="input input-bordered w-full" required />
          </div>

          <div class="form-control w-full mt-2">
            <label class="label">
              <span class="label-text">Cron 表达式</span>
              <a href="https://crontab.guru/" target="_blank" class="label-text-alt link link-primary">参考语法</a>
            </label>
            <input type="text" v-model="formData.cron" placeholder="例如: 0 0 * * * (每天零点)" class="input input-bordered w-full font-mono" required />
          </div>

          <div class="form-control w-full mt-2">
            <label class="label"><span class="label-text">任务消息 (message)</span></label>
            <textarea v-model="formData.message" placeholder="请输入要发给大模型的信息..." class="textarea textarea-bordered h-24" required></textarea>
          </div>

          <div class="form-control mt-4">
            <label class="label cursor-pointer justify-start gap-4">
              <span class="label-text font-medium">是否立即启用</span>
              <input type="checkbox" v-model="formData.isActive" class="toggle toggle-success" />
            </label>
          </div>

          <div class="modal-action">
            <button type="button" class="btn" @click="closeModal">取消</button>
            <button type="submit" class="btn btn-primary">保存</button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="closeModal">关闭</button>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import request from '../../api/request';

interface TaskItem {
  id: string;
  name: string;
  cron: string;
  message: string;
  isActive: boolean;
}

const tasks = ref<TaskItem[]>([]);

// 表单及弹窗状态
const modalMode = ref<'add' | 'edit'>('add');
const formData = reactive<{
  id?: string;
  name: string;
  cron: string;
  message: string;
  isActive: boolean;
}>({
  name: '',
  cron: '',
  message: '',
  isActive: true,
});

// 加载任务列表
const loadTasks = async () => {
  try {
    const res = await request.get('/task');
    // 根据拦截器，返回的是直接数据
    tasks.value = res as unknown as TaskItem[];
  } catch (error) {
    console.error('Failed to load tasks', error);
  }
};

onMounted(() => {
  loadTasks();
});

// 弹窗控制
const openModal = (mode: 'add' | 'edit', task?: TaskItem) => {
  modalMode.value = mode;
  if (mode === 'edit' && task) {
    formData.id = task.id;
    formData.name = task.name;
    formData.cron = task.cron;
    formData.message = task.message;
    formData.isActive = task.isActive;
  } else {
    formData.id = undefined;
    formData.name = '';
    formData.cron = '';
    formData.message = '';
    formData.isActive = true;
  }
  const modal = document.getElementById('task_modal') as HTMLDialogElement;
  modal?.showModal();
};

const closeModal = () => {
  const modal = document.getElementById('task_modal') as HTMLDialogElement;
  modal?.close();
};

// 提交表单
const handleSubmit = async () => {
  try {
    if (modalMode.value === 'add') {
      await request.post('/task/add', {
        name: formData.name,
        cron: formData.cron,
        message: formData.message,
        isActive: formData.isActive
      });
    } else {
      await request.post('/task/edit', {
        id: formData.id,
        name: formData.name,
        cron: formData.cron,
        message: formData.message,
        isActive: formData.isActive
      });
    }
    closeModal();
    loadTasks();
  } catch (error) {
    console.error('Failed to save task', error);
    alert('保存失败，请检查控制台错误');
  }
};

// 切换任务状态
const toggleTaskStatus = async (task: TaskItem) => {
  const newStatus = !task.isActive;
  try {
    // 乐观更新 UI
    task.isActive = newStatus;
    await request.post('/task/toggle', {
      id: task.id,
      isActive: newStatus
    });
  } catch (error) {
    // 失败时回滚状态
    task.isActive = !newStatus;
    console.error('Failed to toggle task status', error);
    alert('状态切换失败');
  }
};

// 删除任务 (原生 confirm 二次确认)
const confirmDelete = async (task: TaskItem) => {
  if (window.confirm(`确定要删除任务 [${task.name}] 吗？`)) {
    try {
      await request.post('/task/delete', { id: task.id });
      loadTasks();
    } catch (error) {
      console.error('Failed to delete task', error);
      alert('删除失败');
    }
  }
};
</script>

<style scoped>
/* 可以根据需要在此补充额外的样式 */
</style>
