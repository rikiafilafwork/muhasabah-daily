import type { RouteRecordRaw } from 'vue-router';

export const financeRoutes: RouteRecordRaw[] = [
  {
    path: '/finance',
    name: 'finance',
    component: () => import('./pages/FinancePage.vue'),
    meta: { requiresAuth: true, title: 'Keuangan' },
  },
];
