import type { RouteRecordRaw } from 'vue-router';
import { NAV_ITEMS } from '@/app/navigation';

/** Rute sementara untuk modul yang belum dibangun. Dihapus satu per satu saat modulnya siap. */
export const comingSoonRoutes: RouteRecordRaw[] = NAV_ITEMS.filter((i) => i.phase).map((i) => ({
  path: i.to,
  component: () => import('./ComingSoonPage.vue'),
  props: { title: i.label, phase: i.phase },
  meta: { requiresAuth: true, title: i.label },
}));
