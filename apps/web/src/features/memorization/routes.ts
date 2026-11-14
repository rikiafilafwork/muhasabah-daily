import type { RouteRecordRaw } from 'vue-router';

export const memorizationRoutes: RouteRecordRaw[] = [
  {
    path: '/memorization',
    name: 'memorization',
    component: () => import('./pages/MemorizationPage.vue'),
    meta: { requiresAuth: true, title: 'Hafidz' },
  },
  {
    path: '/memorization/:id',
    name: 'memorization-plan',
    component: () => import('./pages/PlanPage.vue'),
    meta: { requiresAuth: true, title: 'Hafidz' },
  },
];
