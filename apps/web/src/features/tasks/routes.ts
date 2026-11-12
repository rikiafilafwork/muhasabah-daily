import type { RouteRecordRaw } from 'vue-router';

export const tasksRoutes: RouteRecordRaw[] = [
  {
    path: '/tasks',
    name: 'tasks',
    component: () => import('./pages/TasksPage.vue'),
    meta: { requiresAuth: true, title: 'To-Do' },
  },
];
