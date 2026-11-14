import type { RouteRecordRaw } from 'vue-router';

export const journalRoutes: RouteRecordRaw[] = [
  {
    path: '/journal',
    name: 'journal',
    component: () => import('./pages/JournalPage.vue'),
    meta: { requiresAuth: true, title: 'Jurnal' },
  },
];
