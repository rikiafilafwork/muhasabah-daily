import type { RouteRecordRaw } from 'vue-router';

export const focusRoutes: RouteRecordRaw[] = [
  {
    path: '/focus',
    name: 'focus',
    component: () => import('./pages/FocusPage.vue'),
    meta: { requiresAuth: true, title: 'Fokus' },
  },
];
