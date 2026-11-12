<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import {
  createHabitSchema,
  HABIT_CATEGORIES,
  HABIT_CATEGORY_LABELS,
  type Color,
  type Habit,
  type HabitCategory,
  type HabitTemplate,
} from '@muhasabah/shared';
import { UiAlert, UiButton, UiColorPicker, UiDialog, UiInput, useZodForm } from '@/shared';
import { habitsApi } from '../api';

const props = defineProps<{ templates: HabitTemplate[]; existing: Habit[] }>();
const open = defineModel<boolean>('open', { required: true });
const emit = defineEmits<{ created: [habit: Habit] }>();

const category = ref<HabitCategory>('ibadah');
const search = ref('');
const adding = ref<string | null>(null);
const addError = ref<string | null>(null);
const used = computed(() => new Set(props.existing.map((h) => h.templateId).filter(Boolean)));
const visible = computed(() => {
  const q = search.value.trim().toLowerCase();
  return props.templates.filter((t) =>
    q ? t.name.toLowerCase().includes(q) : t.category === category.value,
  );
});

async function addTemplate(t: HabitTemplate) {
  adding.value = t.id;
  addError.value = null;
  try {
    emit('created', await habitsApi.create({ templateId: t.id }));
  } catch (err) {
    addError.value = err instanceof Error ? err.message : 'Gagal menambah habit';
  } finally {
    adding.value = null;
  }
}

const custom = reactive({ name: '', color: 'violet' as Color });
const { errors, formError, submitting, submit } = useZodForm(createHabitSchema);
function addCustom() {
  return submit({ name: custom.name, color: custom.color }, async (data) => {
    emit('created', await habitsApi.create(data));
    custom.name = '';
  });
}

watch(open, (v) => {
  if (v) {
    search.value = '';
    addError.value = null;
  }
});
</script>

<template>
  <UiDialog
    v-model:open="open"
    title="Tambah habit"
    description="Pilih dari library atau buat sendiri."
    wide
  >
    <div class="space-y-4">
      <UiAlert v-if="addError" tone="error">{{ addError }}</UiAlert>
      <div>
        <label for="habit-search" class="sr-only">Cari habit</label>
        <input
          id="habit-search"
          v-model="search"
          type="search"
          placeholder="Cari di library…"
          class="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-900"
        />
      </div>
      <div v-if="!search" role="tablist" aria-label="Kategori" class="flex flex-wrap gap-1">
        <button
          v-for="c in HABIT_CATEGORIES"
          :key="c"
          role="tab"
          type="button"
          :aria-selected="category === c"
          :class="[
            'rounded-full px-3 py-1 text-sm',
            category === c
              ? 'bg-brand-700 text-white'
              : 'bg-stone-100 text-stone-700 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300',
          ]"
          @click="category = c"
        >
          {{ HABIT_CATEGORY_LABELS[c] }}
        </button>
      </div>
      <ul
        class="max-h-80 divide-y divide-stone-100 overflow-y-auto dark:divide-stone-800"
        data-testid="template-list"
      >
        <li v-for="t in visible" :key="t.id" class="flex items-center justify-between gap-3 py-2">
          <div class="min-w-0">
            <p class="text-sm font-medium">{{ t.name }}</p>
            <p v-if="t.description" class="text-xs text-stone-500 dark:text-stone-400">
              {{ t.description }}
            </p>
            <p v-if="t.reference" class="text-xs text-brand-700 dark:text-brand-500">
              {{ t.reference }}
            </p>
          </div>
          <UiButton
            variant="secondary"
            :disabled="used.has(t.id)"
            :loading="adding === t.id"
            :aria-label="used.has(t.id) ? `${t.name} sudah ditambahkan` : `Tambah ${t.name}`"
            @click="addTemplate(t)"
          >
            {{ used.has(t.id) ? 'Sudah ada' : 'Tambah' }}
          </UiButton>
        </li>
        <li v-if="!visible.length" class="py-4 text-center text-sm text-stone-500">
          Tidak ditemukan.
        </li>
      </ul>

      <form
        class="space-y-3 border-t border-stone-200 pt-4 dark:border-stone-800"
        novalidate
        @submit.prevent="addCustom"
      >
        <h3 class="text-sm font-semibold">Habit sendiri</h3>
        <UiAlert v-if="formError" tone="error">{{ formError }}</UiAlert>
        <UiInput v-model="custom.name" label="Nama habit" :error="errors.name" />
        <UiColorPicker v-model="custom.color" />
        <UiButton type="submit" :loading="submitting">Buat habit</UiButton>
      </form>
    </div>
  </UiDialog>
</template>
