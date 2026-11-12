import type { RouteRecordRaw } from 'vue-router';

export const profileRoutes: RouteRecordRaw[] = [
  {
    path: '/settings',
    name: 'settings',
    component: () => import('./pages/SettingsPage.vue'),
    meta: { requiresAuth: true, title: 'Pengaturan' },
  },
];
