<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { STAGE_LABELS, type Ayah, type MemorizationPlan } from '@muhasabah/shared';
import { ApiError } from '@/api/http';
import { AyahText, loadAyahs } from '@/features/quran';
import { UiAlert, UiButton, UiCard } from '@/shared';
import { memorizationApi } from '../api';
import {
  initialState,
  reduce,
  stageProgress,
  usesAudio,
  type PlayerEvent,
  type PlayerState,
} from '../player';

const route = useRoute();
const router = useRouter();
const plan = ref<MemorizationPlan | null>(null);
const ayahs = ref<Ayah[]>([]);
const error = ref<string | null>(null);
const saving = ref(false);
const hideText = ref(false);
const showTranslation = ref(true);

const stage = computed(() => plan.value?.stages[plan.value.currentStage] ?? null);
const state = ref<PlayerState | null>(null);
const audio = ref<HTMLAudioElement | null>(null);

function dispatch(e: PlayerEvent) {
  if (stage.value && state.value) state.value = reduce(stage.value, state.value, e);
}

watch(
  stage,
  (s) => {
    state.value = s ? initialState(s) : null;
    hideText.value = false;
  },
  { immediate: true },
);

const stageAyahs = computed(() =>
  stage.value
    ? ayahs.value.filter(
        (a) => a.numberInSurah >= stage.value!.fromAyah && a.numberInSurah <= stage.value!.toAyah,
      )
    : [],
);
const currentAyah = computed(
  () => ayahs.value.find((a) => a.numberInSurah === state.value?.ayah) ?? null,
);
const progress = computed(() =>
  stage.value && state.value ? stageProgress(stage.value, state.value) : { done: 0, total: 0 },
);

// Sinkronkan elemen <audio> dengan state: setiap (ayat, ulangan) baru diputar dari awal.
watch(
  () => [state.value?.status, state.value?.ayah, state.value?.repetition] as const,
  async ([status]) => {
    await nextTick();
    const el = audio.value;
    if (!el) return;
    if (status === 'playing' && currentAyah.value) {
      if (el.dataset.key !== `${currentAyah.value.id}:${state.value!.repetition}`) {
        el.dataset.key = `${currentAyah.value.id}:${state.value!.repetition}`;
        el.src = currentAyah.value.audioUrl;
        el.currentTime = 0;
      }
      el.play().catch((err: Error) => {
        if (err.name !== 'AbortError')
          dispatch({
            type: 'AUDIO_ERROR',
            message: 'Audio tidak bisa diputar. Periksa koneksi internet.',
          });
      });
    } else {
      el.pause();
    }
  },
);

onBeforeUnmount(() => audio.value?.pause());

async function load() {
  try {
    plan.value = await memorizationApi.get(String(route.params.id));
    ayahs.value = await loadAyahs(plan.value.surahId, plan.value.fromAyah, plan.value.toAyah);
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'Gagal memuat rencana';
  }
}
onMounted(load);

async function goToStage(index: number) {
  if (!plan.value) return;
  saving.value = true;
  try {
    plan.value = await memorizationApi.update(plan.value.id, { currentStage: index });
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'Gagal menyimpan progres';
  } finally {
    saving.value = false;
  }
}

async function remove() {
  if (!plan.value) return;
  await memorizationApi.remove(plan.value.id);
  await router.replace('/memorization');
}

const kindHint = {
  listen: 'Dengarkan murottal dengan saksama sambil menyimak teks.',
  recite: 'Baca sendiri tanpa audio. Sembunyikan teks untuk menguji hafalan.',
  connect: 'Dengarkan rangkaian ayat yang sudah dihafal agar tersambung.',
} as const;
</script>

<template>
  <div class="mx-auto max-w-5xl space-y-6">
    <RouterLink
      to="/memorization"
      class="text-sm text-brand-700 hover:underline dark:text-brand-500"
      >‹ Semua rencana</RouterLink
    >
    <UiAlert v-if="error" tone="error">{{ error }}</UiAlert>

    <template v-if="plan">
      <header class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 class="text-3xl font-semibold tracking-tight">
            {{ plan.title ?? `QS. ${plan.surahName}: ${plan.fromAyah}–${plan.toAyah}` }}
          </h1>
          <p class="mt-1 text-sm text-stone-500 dark:text-stone-400">
            Tahap {{ Math.min(plan.currentStage + 1, plan.stages.length) }} dari
            {{ plan.stages.length }} · {{ plan.progress }}%
          </p>
        </div>
        <UiButton variant="ghost" @click="remove">Hapus rencana</UiButton>
      </header>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
        <UiCard v-if="stage && state" data-testid="stage-card">
          <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 class="text-lg font-semibold">
              {{ STAGE_LABELS[stage.kind] }} · ayat {{ stage.fromAyah
              }}{{ stage.toAyah !== stage.fromAyah ? `–${stage.toAyah}` : '' }}
            </h2>
            <span
              class="rounded-full bg-stone-100 px-2 py-0.5 text-xs tabular-nums dark:bg-stone-800"
              data-testid="stage-counter"
            >
              {{ progress.done }}/{{ progress.total }}
            </span>
          </div>
          <p class="mb-4 text-sm text-stone-600 dark:text-stone-400">
            {{ kindHint[stage.kind] }} Ulangi {{ stage.repeat }}×.
          </p>

          <div class="space-y-1">
            <AyahText
              v-for="a in stageAyahs"
              :key="a.id"
              :ayah="a"
              :show-translation="showTranslation && !hideText"
              :hidden="hideText"
              :active="
                usesAudio(stage) && state.status !== 'idle' && state.ayah === a.numberInSurah
              "
            />
          </div>

          <div class="mt-4 flex flex-wrap gap-4 text-sm">
            <label class="flex items-center gap-1.5"
              ><input v-model="showTranslation" type="checkbox" class="size-4 accent-brand-700" />
              Terjemah</label
            >
            <label class="flex items-center gap-1.5"
              ><input v-model="hideText" type="checkbox" class="size-4 accent-brand-700" />
              Sembunyikan teks</label
            >
          </div>

          <UiAlert v-if="state.status === 'error'" tone="warning" class="mt-4">
            {{ state.error }}
            <div class="mt-2 flex gap-2">
              <UiButton variant="secondary" @click="dispatch({ type: 'RETRY' })"
                >Coba lagi</UiButton
              >
              <UiButton variant="ghost" @click="dispatch({ type: 'SKIP_AYAH' })"
                >Lewati ayat ini</UiButton
              >
            </div>
          </UiAlert>

          <div
            class="mt-5 flex flex-wrap items-center gap-2 border-t border-stone-100 pt-4 dark:border-stone-800"
          >
            <template v-if="state.status === 'done'">
              <p
                class="flex-1 text-sm font-medium text-brand-800 dark:text-brand-200"
                role="status"
              >
                Tahap selesai. Alhamdulillah.
              </p>
              <UiButton :loading="saving" @click="goToStage(plan.currentStage + 1)">
                {{
                  plan.currentStage + 1 < plan.stages.length
                    ? 'Lanjut ke tahap berikutnya'
                    : 'Tandai hafalan selesai'
                }}
              </UiButton>
            </template>
            <template v-else-if="usesAudio(stage)">
              <UiButton v-if="state.status !== 'playing'" @click="dispatch({ type: 'PLAY' })">
                {{ state.status === 'idle' ? 'Putar' : 'Lanjutkan' }}
              </UiButton>
              <UiButton v-else variant="secondary" @click="dispatch({ type: 'PAUSE' })"
                >Jeda</UiButton
              >
              <span
                class="text-sm text-stone-600 tabular-nums dark:text-stone-400"
                aria-live="polite"
              >
                Ulangan {{ state.repetition }}/{{ stage.repeat }} · ayat {{ state.ayah }}
              </span>
            </template>
            <template v-else>
              <UiButton @click="dispatch({ type: 'RECITED' })">
                Sudah baca ({{ state.repetition }}/{{ stage.repeat }})
              </UiButton>
              <span class="text-sm text-stone-600 dark:text-stone-400"
                >Tekan setiap selesai membaca satu kali.</span
              >
            </template>
          </div>
          <audio
            ref="audio"
            preload="auto"
            class="hidden"
            @ended="dispatch({ type: 'AUDIO_ENDED' })"
            @error="
              dispatch({
                type: 'AUDIO_ERROR',
                message: 'Audio tidak bisa dimuat. Periksa koneksi internet.',
              })
            "
          />
        </UiCard>

        <UiCard v-else>
          <p class="text-center text-lg font-semibold">Hafalan selesai</p>
          <p class="mt-1 text-center text-sm text-stone-500 dark:text-stone-400">
            Jaga dengan muraja'ah rutin.
          </p>
          <div class="mt-4 text-center">
            <UiButton variant="secondary" @click="goToStage(0)">Ulangi dari awal</UiButton>
          </div>
        </UiCard>

        <UiCard title="Tahapan">
          <ol class="max-h-[32rem] space-y-1 overflow-y-auto text-sm">
            <li v-for="(s, i) in plan.stages" :key="s.position">
              <button
                type="button"
                :class="[
                  'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left',
                  i === plan.currentStage
                    ? 'bg-brand-50 font-medium text-brand-800 dark:bg-brand-900/40 dark:text-brand-100'
                    : 'hover:bg-stone-50 dark:hover:bg-stone-800/50',
                ]"
                :aria-current="i === plan.currentStage ? 'step' : undefined"
                @click="goToStage(i)"
              >
                <span
                  :class="[
                    'flex size-5 shrink-0 items-center justify-center rounded-full text-[11px]',
                    i < plan.currentStage
                      ? 'bg-brand-700 text-white'
                      : 'bg-stone-100 dark:bg-stone-800',
                  ]"
                  aria-hidden="true"
                >
                  {{ i < plan.currentStage ? '✓' : i + 1 }}
                </span>
                <span class="flex-1"
                  >{{ STAGE_LABELS[s.kind] }} {{ s.fromAyah
                  }}{{ s.toAyah !== s.fromAyah ? `–${s.toAyah}` : '' }}</span
                >
                <span class="text-xs text-stone-500 dark:text-stone-400">{{ s.repeat }}×</span>
                <span class="sr-only">{{ i < plan.currentStage ? '(selesai)' : '' }}</span>
              </button>
            </li>
          </ol>
        </UiCard>
      </div>
      <p class="text-xs text-stone-500 dark:text-stone-400">
        Audio murottal Syaikh Mishary Alafasy, di-stream dari cdn.islamic.network; teks dan terjemah
        dari AlQuran Cloud.
      </p>
    </template>
  </div>
</template>
