import type { RouteRecordRaw } from 'vue-router';

export const lectureNotesRoutes: RouteRecordRaw[] = [
  {
    path: '/lecture-notes',
    name: 'lecture-notes',
    component: () => import('./pages/LectureNotesPage.vue'),
    meta: { requiresAuth: true, title: 'Kajian' },
  },
  {
    path: '/lecture-notes/:id',
    name: 'lecture-note',
    component: () => import('./pages/LectureNoteEditorPage.vue'),
    meta: { requiresAuth: true, title: 'Kajian' },
  },
];
