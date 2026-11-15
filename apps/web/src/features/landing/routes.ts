import type { RouteRecordRaw } from 'vue-router';

export const landingRoutes: RouteRecordRaw[] = [
  {
    path: '/welcome',
    name: 'landing',
    component: () => import('./pages/LandingPage.vue'),
    meta: {
      guestOnly: true,
      layout: 'blank',
      title: 'Produktivitas Muslim di sekitar waktu sholat',
    },
  },
];
