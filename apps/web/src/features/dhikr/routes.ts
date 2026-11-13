import type { RouteRecordRaw } from 'vue-router';

export const dhikrRoutes: RouteRecordRaw[] = [
  {
    path: '/dhikr',
    name: 'dhikr',
    component: () => import('./pages/DhikrPage.vue'),
    meta: { requiresAuth: true, title: 'Dzikir' },
  },
];
