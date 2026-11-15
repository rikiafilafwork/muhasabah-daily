import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { authRoutes, useSessionStore } from '@/features/auth';
import { dashboardRoutes } from '@/features/dashboard';
import { dhikrRoutes } from '@/features/dhikr';
import { focusRoutes } from '@/features/focus';
import { journalRoutes } from '@/features/journal';
import { landingRoutes } from '@/features/landing';
import { lectureNotesRoutes } from '@/features/lecture-notes';
import { memorizationRoutes } from '@/features/memorization';
import { goalsRoutes } from '@/features/goals';
import { habitsRoutes } from '@/features/habits';
import { profileRoutes } from '@/features/profile';
import { scheduleRoutes } from '@/features/schedule';
import { tasksRoutes } from '@/features/tasks';

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean;
    guestOnly?: boolean;
    layout?: 'app' | 'auth' | 'blank';
    title?: string;
  }
}

const routes: RouteRecordRaw[] = [
  ...landingRoutes,
  ...authRoutes,
  ...dashboardRoutes,
  ...profileRoutes,
  ...scheduleRoutes,
  ...tasksRoutes,
  ...habitsRoutes,
  ...goalsRoutes,
  ...focusRoutes,
  ...dhikrRoutes,
  ...memorizationRoutes,
  ...journalRoutes,
  ...lectureNotesRoutes,
  { path: '/:pathMatch(.*)*', redirect: '/' },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to) => {
  const session = useSessionStore();
  if (session.status === 'unknown') await session.bootstrap();

  if (to.meta.requiresAuth && !session.isAuthenticated) {
    // Pengunjung yang membuka beranda tanpa sesi melihat landing page.
    if (to.name === 'dashboard') return { name: 'landing' };
    return { name: 'login', query: { redirect: to.fullPath } };
  }
  if (to.meta.guestOnly && session.isAuthenticated) return { name: 'dashboard' };
  return true;
});

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · Muhasabah Daily` : 'Muhasabah Daily';
});
