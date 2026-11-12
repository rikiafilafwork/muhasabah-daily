import type { RouteRecordRaw } from 'vue-router';

export const habitsRoutes: RouteRecordRaw[] = [
  {
    path: '/habits',
    name: 'habits',
    component: () => import('./pages/HabitsPage.vue'),
    meta: { requiresAuth: true, title: 'Habit' },
  },
];
