import { createRouter, createWebHashHistory } from 'vue-router';

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/welcome',
      name: 'Welcome',
      component: () => import('../views/Welcome.vue'),
    },
    {
      path: '/chat',
      name: 'Chat',
      component: () => import('../views/Chat.vue'),
    },
    {
      path: '/config',
      name: 'Config',
      component: () => import('../views/Config.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/welcome',
    }
  ],
});

export default router;
