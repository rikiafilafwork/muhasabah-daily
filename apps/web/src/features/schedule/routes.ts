import type { RouteRecordRaw } from 'vue-router';

export const scheduleRoutes: RouteRecordRaw[] = [
  {
    path: '/schedule',
    name: 'schedule',
    component: () => import('./pages/SchedulePage.vue'),
    meta: { requiresAuth: true, title: 'Jadwal' },
  },
];
