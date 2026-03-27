<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">技能配置</h2>
      <button class="btn btn-primary btn-sm" @click="openModal()">添加技能</button>
    </div>

    <div class="overflow-x-auto bg-base-100 border border-base-300 rounded-box">
      <table class="table">
        <thead>
          <tr>
            <th class="w-16">序号</th>
            <th class="w-1/4">技能名称</th>
            <th class="w-1/2">技能摘要</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="skills.length === 0">
            <td colspan="4" class="text-center text-gray-500 py-8">暂无配置的技能，请添加</td>
          </tr>
          <tr v-for="(skill, index) in skills" :key="skill.id">
            <td>{{ index + 1 }}</td>
            <td>{{ skill.name }}</td>
            <td class="max-w-[300px] truncate" :title="skill.summary">{{ skill.summary }}</td>
            <td>
              <button class="btn btn-ghost btn-xs text-info" @click="openModal(skill)">编辑</button>
              <button class="btn btn-ghost btn-xs text-error ml-2" @click="deleteSkill(skill.id)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Dialog -->
    <dialog id="skill_modal" class="modal" ref="modalRef">
      <div class="modal-box w-11/12 max-w-3xl">
        <h3 class="font-bold text-lg mb-4">{{ isEditing ? '编辑技能' : '添加技能' }}</h3>
        
        <form @submit.prevent="saveSkill" class="flex flex-col gap-4">
          <div class="form-control">
            <label class="label"><span class="label-text">技能名称</span></label>
            <input type="text" v-model="formData.name" placeholder="请输入技能名称" class="input input-bordered w-full" required />
          </div>

          <div class="form-control">
            <label class="label"><span class="label-text">技能摘要</span></label>
            <textarea v-model="formData.summary" placeholder="请输入技能摘要..." class="textarea textarea-bordered w-full" rows="3" required></textarea>
          </div>

          <div class="form-control">
            <label class="label"><span class="label-text">技能正文</span></label>
            <textarea v-model="formData.content" placeholder="请输入技能正文内容..." class="textarea textarea-bordered w-full font-mono text-sm" rows="10" required></textarea>
          </div>

          <div class="modal-action">
            <button type="button" class="btn" @click="closeModal">取消</button>
            <button type="submit" class="btn btn-primary" :disabled="isLoading">
              <span v-if="isLoading" class="loading loading-spinner loading-xs"></span>
              保存
            </button>
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

interface Skill {
  id: string;
  name: string;
  summary: string;
  path?: string;
}

interface SkillFormData {
  name: string;
  summary: string;
  content: string;
}

const skills = ref<Skill[]>([]);

// API 接口定义
const apiGetSkills = () => request.get('/config/skills');
const apiAddSkill = (data: SkillFormData) => request.post('/config/skills', data);
const apiEditSkill = (data: SkillFormData & { id: string }) => request.post('/config/skills/edit', data);
const apiDeleteSkill = (id: string) => request.post('/config/skills/delete', { id });
const apiGetSkillDetail = (id: string) => request.post('/config/skills/detail', { id });

const modalRef = ref<HTMLDialogElement | null>(null);
const isEditing = ref(false);
const editingId = ref<string | null>(null);
const isLoading = ref(false);

const formData = reactive<SkillFormData>({
  name: '',
  summary: '',
  content: '',
});

const loadSkills = async () => {
  try {
    const res: any = await apiGetSkills();
    skills.value = Array.isArray(res) ? res : [];
  } catch (error) {
    console.error('Failed to fetch skills config on mount', error);
  }
};

onMounted(() => {
  loadSkills();
});

const openModal = async (skill?: Skill) => {
  if (skill) {
    isEditing.value = true;
    editingId.value = skill.id;
    formData.name = skill.name;
    formData.summary = skill.summary;
    formData.content = '加载中...';
    
    modalRef.value?.showModal();

    try {
      const res: any = await apiGetSkillDetail(skill.id);
      formData.content = res?.content || '';
    } catch (error) {
      console.error('Failed to load skill detail', error);
      formData.content = '';
      alert('加载详情失败，请重试');
    }
  } else {
    isEditing.value = false;
    editingId.value = null;
    resetForm();
    modalRef.value?.showModal();
  }
};

const closeModal = () => {
  modalRef.value?.close();
  resetForm();
};

const resetForm = () => {
  formData.name = '';
  formData.summary = '';
  formData.content = '';
};

const saveSkill = async () => {
  if (isLoading.value) return;
  
  try {
    isLoading.value = true;
    if (isEditing.value && editingId.value) {
      await apiEditSkill({
        id: editingId.value,
        ...formData,
      });
    } else {
      await apiAddSkill({ ...formData });
    }
    await loadSkills();
    closeModal();
  } catch (error) {
    console.error('Failed to save skill', error);
    alert('保存失败，请检查网络或控制台日志');
  } finally {
    isLoading.value = false;
  }
};

const deleteSkill = async (id: string) => {
  if (confirm('确定要删除该技能配置吗？此操作不可恢复。')) {
    try {
      await apiDeleteSkill(id);
      await loadSkills();
    } catch (error) {
      console.error('Failed to delete skill', error);
      alert('删除失败');
    }
  }
};
</script>
