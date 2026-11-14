<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import type { MemorizationPlan } from '@muhasabah/shared';
import { ApiError } from '@/api/http';
import { QuranNotSeeded, useSurahs } from '@/features/quran';
import { UiAlert, UiButton } from '@/shared';
import { memorizationApi } from '../api';
import PlanDialog from '../components/PlanDialog.vue';

const router = useRouter();
const { surahs, notSeeded } = useSurahs();
const plans = ref<MemorizationPlan[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const dialog = ref(false);

onMounted(async () => {
  try {
    plans.value = (await memorizationApi.list()).items;
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'Gagal memuat rencana hafalan';
  } finally {
    loading.value = false;
  }
});

function onCreated(plan: MemorizationPlan) {
  void router.push(`/memorization/${plan.id}`);
}
</script>

<template>
  <div class="mx-auto max-w-4xl space-y-6">
    <header class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-3xl font-semibold tracking-tight">Hafidz</h1>
        <p class="mt-1 text-sm text-stone-500 dark:text-stone-400">
          Hafalan bertahap dengan metode tikrar: dengar, baca, sambung.
        </p>
      </div>
      <UiButton :disabled="notSeeded" @click="dialog = true">Rencana baru</UiButton>
    </header>

    <QuranNotSeeded v-if="notSeeded" />
    <UiAlert v-if="error" tone="error">{{ error }}</UiAlert>

    <ul v-if="plans.length" class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <li v-for="p in plans" :key="p.id">
        <RouterLink
          :to="`/memorization/${p.id}`"
          class="block rounded-3xl border border-stone-200/80 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-brand-300 dark:border-stone-800 dark:bg-stone-900"
          data-testid="plan-card"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="font-semibold">
                {{ p.title ?? `${p.surahName} ${p.fromAyah}–${p.toAyah}` }}
              </h2>
              <p class="text-sm text-stone-500 dark:text-stone-400">
                QS. {{ p.surahName }}: {{ p.fromAyah }}–{{ p.toAyah }} · {{ p.stages.length }} tahap
              </p>
            </div>
            <span
              v-if="p.completed"
              class="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-800 dark:bg-brand-900 dark:text-brand-100"
            >
              Selesai
            </span>
          </div>
          <div class="mt-4 flex items-center gap-3">
            <div
              class="h-2 flex-1 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800"
              role="progressbar"
              :aria-valuenow="p.progress"
              aria-valuemin="0"
              aria-valuemax="100"
              :aria-label="`Progres hafalan ${p.surahName}`"
            >
              <div class="h-full rounded-full bg-brand-600" :style="{ width: `${p.progress}%` }" />
            </div>
            <span class="text-sm tabular-nums">{{ p.progress }}%</span>
          </div>
        </RouterLink>
      </li>
    </ul>
    <div
      v-else-if="!loading && !notSeeded"
      class="rounded-2xl border border-dashed border-stone-300 py-12 text-center dark:border-stone-700"
    >
      <p class="text-sm text-stone-500 dark:text-stone-400">
        Belum ada rencana. Mulai dari beberapa ayat pendek, misalnya Al-Ikhlas.
      </p>
      <UiButton class="mt-3" variant="secondary" @click="dialog = true"
        >Buat rencana pertama</UiButton
      >
    </div>

    <PlanDialog v-model:open="dialog" :surahs="surahs" @created="onCreated" />
  </div>
</template>
