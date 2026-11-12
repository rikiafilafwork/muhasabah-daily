import type { RouteRecordRaw } from 'vue-router';

export const authRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('./pages/LoginPage.vue'),
    meta: { guestOnly: true, layout: 'auth', title: 'Masuk' },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('./pages/RegisterPage.vue'),
    meta: { guestOnly: true, layout: 'auth', title: 'Daftar' },
  },
];
