<template>
  <div class="flex h-screen bg-base-100">
    <!-- Sidebar -->
    <div class="w-64 bg-base-200 p-4 border-r border-base-300 flex flex-col gap-2">
      <div class="flex items-center gap-2 mb-4 px-2">
        <button class="btn btn-ghost btn-sm btn-circle" @click="$router.push('/chat')" title="返回聊天">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>
        <h2 class="text-xl font-bold m-0">配置项</h2>
      </div>
      <ul class="menu bg-base-200 w-full p-0 gap-1">
        <li v-for="menu in configMenus" :key="menu.id">
          <a 
            :class="[
              'transition-colors duration-200',
              currentConfig === menu.id 
                ? 'bg-primary text-primary-content hover:bg-primary-focus' 
                : 'hover:bg-base-300'
            ]" 
            @click="currentConfig = menu.id"
          >
            {{ menu.name }}
          </a>
        </li>
      </ul>
    </div>

    <!-- Content Area -->
    <div class="flex-1 p-6 overflow-y-auto">
      <ModelConfig v-if="currentConfig === 'model'" />
      <Task v-else-if="currentConfig === 'scheduler'" />
      <Skills v-else-if="currentConfig === 'skills'" />
      <ToBeContinue v-else-if="currentConfig === 'im'" title="IM渠道" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ModelConfig from '../components/SubConfig/Model.vue';
import Skills from '../components/SubConfig/Skills.vue';
import ToBeContinue from '../components/SubConfig/ToBeContinue.vue';
import Task from '../components/SubConfig/Task.vue';

const currentConfig = ref('model');

const configMenus = [
  { id: 'model', name: '大模型配置' },
  { id: 'scheduler', name: '定时任务' },
  { id: 'skills', name: '技能配置' },
  { id: 'im', name: 'IM渠道' },
];
</script>
