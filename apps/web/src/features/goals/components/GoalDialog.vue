<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { createGoalSchema, type Goal, type Habit } from '@muhasabah/shared';
import { UiAlert, UiButton, UiDialog, UiInput, UiTextarea, useZodForm } from '@/shared';
import { goalsApi } from '../api';

const props = defineProps<{ goal: Goal | null; habits: Habit[]; today: string }>();
const open = defineModel<boolean>('open', { required: true });
const emit = defineEmits<{ saved: []; deleted: [] }>();

const form = reactive({
  title: '',
  description: '',
  target: '',
  unit: '',
  manualValue: '0',
  startDate: '',
  deadline: '',
});
/** habitId → bobot (string dari input). Habit tertaut bila ada di map. */
const links = reactive(new Map<string, string>());
const { errors, formError, submitting, submit } = useZodForm(createGoalSchema);
const deleting = ref(false);

watch(open, (v) => {
  if (!v) return;
  const g = props.goal;
  form.title = g?.title ?? '';
  form.description = g?.description ?? '';
  form.target = g ? String(g.target) : '';
  form.unit = g?.unit ?? '';
  form.manualValue = String(g?.manualValue ?? 0);
  form.startDate = g?.startDate ?? props.today;
  form.deadline = g?.deadline ?? '';
  links.clear();
  for (const h of g?.habits ?? []) links.set(h.habitId, String(h.weight));
});

const linkList = computed(() =>
  [...links.entries()].map(([habitId, weight]) => ({ habitId, weight: Number(weight) || 1 })),
);

function toggleLink(id: string, on: boolean) {
  if (on) links.set(id, links.get(id) ?? '1');
  else links.delete(id);
}

const num = (s: string) => (s.trim() === '' ? NaN : Number(s));

function onSubmit() {
  const values = {
    title: form.title,
    description: form.description.trim() || null,
    target: num(form.target),
    unit: form.unit.trim() || null,
    manualValue: num(form.manualValue),
    startDate: form.startDate,
    deadline: form.deadline || null,
    habits: linkList.value,
  };
  return submit(values, async ({ habits, ...fields }) => {
    if (props.goal) {
      await goalsApi.update(props.goal.id, fields);
      await goalsApi.setHabits(props.goal.id, { habits: habits ?? [] });
    } else {
      await goalsApi.create({ ...fields, habits });
    }
    emit('saved');
    open.value = false;
  });
}

async function onDelete() {
  if (!props.goal) return;
  deleting.value = true;
  try {
    await goalsApi.remove(props.goal.id);
    emit('deleted');
    open.value = false;
  } finally {
    deleting.value = false;
  }
}
</script>

<template>
  <UiDialog v-model:open="open" :title="goal ? 'Ubah goal' : 'Goal baru'" wide>
    <form class="space-y-4" novalidate @submit.prevent="onSubmit">
      <UiAlert v-if="formError" tone="error">{{ formError }}</UiAlert>
      <UiInput v-model="form.title" label="Judul" required :error="errors.title" />
      <UiTextarea
        v-model="form.description"
        label="Deskripsi (opsional)"
        :rows="2"
        :error="errors.description"
      />
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <UiInput
          v-model="form.target"
          label="Target"
          inputmode="numeric"
          required
          :error="errors.target"
        />
        <UiInput
          v-model="form.unit"
          label="Satuan"
          hint="mis. juz, hari, km"
          :error="errors.unit"
        />
        <UiInput
          v-model="form.manualValue"
          label="Nilai manual"
          inputmode="numeric"
          :error="errors.manualValue"
        />
        <UiInput
          v-model="form.startDate"
          label="Mulai dihitung"
          type="date"
          :error="errors.startDate"
        />
        <UiInput
          v-model="form.deadline"
          label="Tenggat (opsional)"
          type="date"
          :error="errors.deadline"
        />
      </div>

      <fieldset>
        <legend class="text-sm font-medium text-stone-700 dark:text-stone-300">
          Habit tertaut
        </legend>
        <p class="mb-2 text-xs text-stone-500 dark:text-stone-400">
          Setiap centang habit sejak tanggal mulai menambah progres sebesar bobotnya.
        </p>
        <p v-if="!habits.length" class="text-sm text-stone-500 dark:text-stone-400">
          Belum ada habit untuk ditautkan.
        </p>
        <ul class="max-h-56 space-y-1 overflow-y-auto">
          <li v-for="h in habits" :key="h.id" class="flex items-center gap-3">
            <label class="flex flex-1 items-center gap-2 text-sm">
              <input
                type="checkbox"
                class="size-4 accent-brand-700"
                :checked="links.has(h.id)"
                @change="toggleLink(h.id, ($event.target as HTMLInputElement).checked)"
              />
              {{ h.name }}
            </label>
            <label
              v-if="links.has(h.id)"
              class="flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400"
            >
              Bobot
              <input
                :value="links.get(h.id)"
                type="number"
                min="1"
                max="1000"
                class="w-16 rounded border border-stone-300 bg-white px-2 py-1 text-sm dark:border-stone-700 dark:bg-stone-900"
                @input="links.set(h.id, ($event.target as HTMLInputElement).value)"
              />
            </label>
          </li>
        </ul>
        <p v-if="errors.habits" class="mt-1 text-sm text-red-700">{{ errors.habits }}</p>
      </fieldset>

      <div class="flex items-center justify-between gap-2 pt-2">
        <UiButton v-if="goal" variant="ghost" :loading="deleting" @click="onDelete">Hapus</UiButton>
        <span v-else />
        <div class="flex gap-2">
          <UiButton variant="secondary" @click="open = false">Batal</UiButton>
          <UiButton type="submit" :loading="submitting">Simpan</UiButton>
        </div>
      </div>
    </form>
  </UiDialog>
</template>
