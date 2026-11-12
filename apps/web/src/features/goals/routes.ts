import type { RouteRecordRaw } from 'vue-router';

export const goalsRoutes: RouteRecordRaw[] = [
  {
    path: '/goals',
    name: 'goals',
    component: () => import('./pages/GoalsPage.vue'),
    meta: { requiresAuth: true, title: 'Goals' },
  },
];
