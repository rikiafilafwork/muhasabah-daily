<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { CreateTaskInput, Project, Task } from '@muhasabah/shared';
import { useUserClock } from '@/features/auth';
import { COLOR_CLASSES, UiAlert, UiButton, UiCard, UiSelect } from '@/shared';
import { projectsApi, tasksApi } from '../api';
import ProjectDialog from '../components/ProjectDialog.vue';
import TaskDialog from '../components/TaskDialog.vue';
import TaskItem from '../components/TaskItem.vue';
import { useTaskList } from '../composables/useTaskList';
import { BUILTIN_VIEWS, defaultsForView, parseView, queryForView, type TaskView } from '../views';

const route = useRoute();
const router = useRouter();
const { today } = useUserClock();

const view = computed<TaskView>(() => parseView(route.query.view));
const query = computed(() => queryForView(view.value));
const list = useTaskList(query);

const projects = ref<Project[]>([]);
const projectById = computed(() => new Map(projects.value.map((p) => [p.id, p])));
const currentProject = computed(() =>
  view.value.startsWith('project:') ? projectById.value.get(view.value.slice(8)) : undefined,
);
const viewMeta = computed(() => BUILTIN_VIEWS.find((v) => v.id === view.value));
const title = computed(() => currentProject.value?.name ?? viewMeta.value?.label ?? 'Tugas');

async function loadProjects() {
  projects.value = (await projectsApi.list()).items;
}
onMounted(loadProjects);

function go(v: TaskView) {
  void router.replace({ query: { view: v } });
}

// Pemilih proyek versi mobile.
const projectPick = computed({
  get: () => (currentProject.value ? view.value : ''),
  set: (v: string) => {
    if (v) go(v as TaskView);
  },
});

// Tambah cepat
const quickTitle = ref('');
const quickAdding = ref(false);
async function quickAdd() {
  const title = quickTitle.value.trim();
  if (!title) return;
  quickAdding.value = true;
  try {
    const task = await tasksApi.create({ title, ...defaultsForView(view.value, today.value) });
    list.upsertLocal(task);
    quickTitle.value = '';
    void loadProjects();
  } catch (err) {
    list.error.value = err instanceof Error ? err.message : 'Gagal menambah tugas';
  } finally {
    quickAdding.value = false;
  }
}

// Dialog
const taskDialog = ref(false);
const editing = ref<Task | null>(null);
const dialogDefaults = computed<Partial<CreateTaskInput>>(() =>
  defaultsForView(view.value, today.value),
);
function openTask(task: Task | null) {
  editing.value = task;
  taskDialog.value = true;
}
function onSaved(task: Task) {
  list.upsertLocal(task);
  void loadProjects();
}

const projectDialog = ref(false);
const editingProject = ref<Project | null>(null);
function openProject(p: Project | null) {
  editingProject.value = p;
  projectDialog.value = true;
}
async function onProjectChanged(p: Project) {
  await loadProjects();
  if (p.archived && view.value === `project:${p.id}`) go('inbox');
  else if (!editingProject.value) go(`project:${p.id}`);
}
async function onProjectDeleted() {
  await loadProjects();
  go('inbox');
}

async function toggle(task: Task) {
  await list.toggleComplete(task);
  void loadProjects();
}

const navClass = (active: boolean) => [
  'flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm whitespace-nowrap lg:w-full',
  active
    ? 'bg-brand-50 font-medium text-brand-800 dark:bg-brand-900/40 dark:text-brand-100'
    : 'text-stone-700 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800',
];
</script>

<template>
  <div class="mx-auto grid grid-cols-1 max-w-6xl gap-6 lg:grid-cols-[14rem_1fr]">
    <aside aria-label="Daftar tugas" class="min-w-0">
      <h1 class="mb-4 text-3xl font-semibold tracking-tight lg:sr-only">To-Do</h1>
      <nav class="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
        <button
          v-for="v in BUILTIN_VIEWS"
          :key="v.id"
          type="button"
          :class="[navClass(view === v.id), 'shrink-0 lg:shrink']"
          :aria-current="view === v.id ? 'page' : undefined"
          @click="go(v.id)"
        >
          {{ v.label }}
        </button>
      </nav>

      <div class="mt-4 hidden lg:block">
        <div class="mb-1 flex items-center justify-between px-3">
          <h2
            class="text-xs font-semibold tracking-wide text-stone-500 uppercase dark:text-stone-400"
          >
            Proyek
          </h2>
          <button
            type="button"
            class="rounded p-1 text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
            @click="openProject(null)"
          >
            <span class="sr-only">Proyek baru</span>
            <svg
              class="size-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <path d="M12 5v14M5 12h14" stroke-linecap="round" />
            </svg>
          </button>
        </div>
        <ul class="space-y-0.5">
          <li v-for="p in projects" :key="p.id">
            <button
              type="button"
              :class="navClass(view === `project:${p.id}`)"
              :aria-current="view === `project:${p.id}` ? 'page' : undefined"
              @click="go(`project:${p.id}`)"
            >
              <span
                :class="['size-2.5 shrink-0 rounded-full', COLOR_CLASSES[p.color].dot]"
                aria-hidden="true"
              />
              <span class="flex-1 truncate">{{ p.name }}</span>
              <span class="text-xs text-stone-500 dark:text-stone-400">{{
                p.openTaskCount || ''
              }}</span>
            </button>
          </li>
          <li v-if="!projects.length" class="px-3 py-1 text-xs text-stone-500 dark:text-stone-400">
            Belum ada proyek.
          </li>
        </ul>
      </div>

      <div class="mt-2 flex gap-2 lg:hidden">
        <UiSelect
          v-model="projectPick"
          class="min-w-0 flex-1"
          label="Pilih proyek"
          hide-label
          placeholder="Proyek…"
          :options="projects.map((p) => ({ value: `project:${p.id}`, label: p.name }))"
        />
        <UiButton variant="secondary" @click="openProject(null)">+ Proyek</UiButton>
      </div>
    </aside>

    <section class="min-w-0">
      <header class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <span
            v-if="currentProject"
            :class="['size-3 rounded-full', COLOR_CLASSES[currentProject.color].dot]"
            aria-hidden="true"
          />
          <h2 class="text-xl font-semibold">{{ title }}</h2>
          <button
            v-if="currentProject"
            type="button"
            class="rounded px-2 py-1 text-xs text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
            @click="openProject(currentProject)"
          >
            Ubah
          </button>
        </div>
        <UiButton @click="openTask(null)">Tugas baru</UiButton>
      </header>

      <UiCard>
        <form v-if="view !== 'done'" class="mb-3 flex gap-2" @submit.prevent="quickAdd">
          <label for="quick-add" class="sr-only">Tambah tugas cepat</label>
          <input
            id="quick-add"
            v-model="quickTitle"
            placeholder="Tambah tugas, lalu tekan Enter"
            maxlength="300"
            class="min-w-0 flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:outline-2 focus:outline-brand-600 dark:border-stone-700 dark:bg-stone-900"
          />
          <UiButton type="submit" variant="secondary" :loading="quickAdding">Tambah</UiButton>
        </form>

        <UiAlert v-if="list.error.value" tone="error" class="mb-3">{{ list.error.value }}</UiAlert>

        <ul
          v-if="list.items.value.length"
          class="divide-y divide-stone-100 dark:divide-stone-800"
          data-testid="task-list"
        >
          <TaskItem
            v-for="t in list.items.value"
            :key="t.id"
            :task="t"
            :today="today"
            :project="t.projectId && !currentProject ? projectById.get(t.projectId) : undefined"
            :busy="list.busyIds.value.has(t.id)"
            @toggle="toggle(t)"
            @focus="list.toggleFocus(t)"
            @open="openTask(t)"
          />
        </ul>
        <p
          v-else-if="!list.loading.value"
          class="py-8 text-center text-sm text-stone-500 dark:text-stone-400"
        >
          {{ viewMeta?.empty ?? 'Belum ada tugas di proyek ini.' }}
        </p>
        <div
          v-if="list.loading.value && !list.items.value.length"
          class="space-y-2"
          aria-hidden="true"
        >
          <div
            v-for="i in 4"
            :key="i"
            class="h-10 animate-pulse rounded bg-stone-100 dark:bg-stone-800"
          />
        </div>

        <div v-if="list.nextCursor.value" class="mt-3 text-center">
          <UiButton variant="ghost" :loading="list.loading.value" @click="list.load(true)">
            Muat lebih banyak
          </UiButton>
        </div>
      </UiCard>
    </section>

    <TaskDialog
      v-model:open="taskDialog"
      :task="editing"
      :projects="projects"
      :defaults="dialogDefaults"
      @saved="onSaved"
      @deleted="(id) => (list.removeLocal(id), loadProjects())"
    />
    <ProjectDialog
      v-model:open="projectDialog"
      :project="editingProject"
      @saved="onProjectChanged"
      @deleted="onProjectDeleted"
    />
  </div>
</template>
