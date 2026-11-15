<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import {
  OBLIGATORY_PRAYERS,
  PRAYER_LABELS,
  type ObligatoryPrayer,
  type PushConfig,
} from '@muhasabah/shared';
import { useSessionStore } from '@/features/auth';
import { UiAlert, UiButton, UiCard } from '@/shared';
import { pushApi, reminderPrefsApi } from '../api';
import {
  currentSubscription,
  disablePush,
  enablePush,
  getRegistration,
  pushUnsupportedReason,
} from '../push-device';

const session = useSessionStore();
const user = computed(() => session.user!);
const unsupported = pushUnsupportedReason();

const config = ref<PushConfig | null>(null);
/** Status perangkat ini: on = berlangganan; off = belum; nosw = service worker tidak aktif. */
const device = ref<'checking' | 'on' | 'off' | 'nosw'>('checking');
const busy = ref(false);
const message = ref<{ tone: 'success' | 'error' | 'info'; text: string } | null>(null);
const savingPrayers = ref(false);

const hasLocation = computed(() => user.value.latitude != null);
const prayers = computed(() => user.value.prayerReminders);

onMounted(async () => {
  try {
    config.value = await pushApi.config();
  } catch {
    config.value = null;
  }
  if (unsupported) return;
  try {
    if (!(await getRegistration())) device.value = 'nosw';
    else device.value = (await currentSubscription()) ? 'on' : 'off';
  } catch {
    device.value = 'nosw';
  }
});

const errorText = (err: unknown) =>
  err instanceof Error ? err.message : 'Terjadi kesalahan. Coba lagi.';

async function enable() {
  if (!config.value?.publicKey) return;
  busy.value = true;
  message.value = null;
  try {
    await enablePush(config.value.publicKey);
    device.value = 'on';
    message.value = { tone: 'success', text: 'Notifikasi aktif di perangkat ini.' };
  } catch (err) {
    message.value = { tone: 'error', text: errorText(err) };
  } finally {
    busy.value = false;
  }
}

async function disable() {
  busy.value = true;
  message.value = null;
  try {
    await disablePush();
    device.value = 'off';
    message.value = { tone: 'info', text: 'Notifikasi dimatikan di perangkat ini.' };
  } catch (err) {
    message.value = { tone: 'error', text: errorText(err) };
  } finally {
    busy.value = false;
  }
}

async function sendTest() {
  busy.value = true;
  message.value = null;
  try {
    const { sent } = await pushApi.test();
    message.value = {
      tone: 'success',
      text: `Notifikasi tes dikirim ke ${sent} perangkat. Bila tidak muncul, periksa mode Jangan Ganggu dan izin notifikasi sistem.`,
    };
  } catch (err) {
    message.value = { tone: 'error', text: errorText(err) };
  } finally {
    busy.value = false;
  }
}

async function togglePrayer(p: ObligatoryPrayer, on: boolean) {
  const next = on ? [...prayers.value, p] : prayers.value.filter((x) => x !== p);
  savingPrayers.value = true;
  message.value = null;
  try {
    session.setUser(await reminderPrefsApi.setPrayers(next));
  } catch (err) {
    message.value = { tone: 'error', text: errorText(err) };
  } finally {
    savingPrayers.value = false;
  }
}
</script>

<template>
  <UiCard
    title="Pengingat"
    description="Notifikasi saat waktu sholat masuk dan sebelum agenda dimulai."
  >
    <div class="space-y-5">
      <UiAlert v-if="message" :tone="message.tone">{{ message.text }}</UiAlert>

      <section aria-labelledby="reminder-device">
        <h3 id="reminder-device" class="text-sm font-semibold">Perangkat ini</h3>
        <UiAlert v-if="config && !config.enabled" tone="warning" class="mt-2">
          Server belum menyiapkan notifikasi. Atur <code>VAPID_PUBLIC_KEY</code> dan
          <code>VAPID_PRIVATE_KEY</code> (mode Docker membuatnya otomatis).
        </UiAlert>
        <UiAlert v-else-if="unsupported" tone="warning" class="mt-2">{{ unsupported }}</UiAlert>
        <UiAlert v-else-if="device === 'nosw'" tone="warning" class="mt-2">
          Service worker belum aktif. Notifikasi hanya tersedia di build produksi; muat ulang
          halaman bila baru saja memperbarui aplikasi.
        </UiAlert>
        <div v-else-if="config" class="mt-2 flex flex-wrap items-center gap-3">
          <p class="text-sm text-stone-600 dark:text-stone-300" aria-live="polite">
            <template v-if="device === 'checking'">Memeriksa…</template>
            <template v-else-if="device === 'on'">Notifikasi aktif di perangkat ini.</template>
            <template v-else>Notifikasi belum aktif di perangkat ini.</template>
          </p>
          <div class="flex flex-wrap gap-2">
            <UiButton v-if="device === 'off'" :loading="busy" @click="enable">
              Aktifkan notifikasi
            </UiButton>
            <template v-if="device === 'on'">
              <UiButton variant="secondary" :loading="busy" @click="sendTest">
                Kirim notifikasi tes
              </UiButton>
              <UiButton variant="ghost" :disabled="busy" @click="disable">Matikan</UiButton>
            </template>
          </div>
        </div>
      </section>

      <fieldset :disabled="savingPrayers || !hasLocation">
        <legend class="text-sm font-semibold">Saat waktu sholat masuk</legend>
        <p v-if="!hasLocation" class="mt-1 text-sm text-stone-500 dark:text-stone-400">
          Atur lokasi di atas terlebih dahulu.
        </p>
        <div class="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
          <label
            v-for="p in OBLIGATORY_PRAYERS"
            :key="p"
            class="flex cursor-pointer items-center gap-2 rounded-xl border border-stone-300 px-3 py-2 text-sm has-checked:border-brand-600 has-checked:bg-brand-50 has-focus-visible:outline-2 has-focus-visible:outline-brand-600 has-disabled:cursor-not-allowed has-disabled:opacity-60 dark:border-stone-700 dark:has-checked:bg-brand-900/40"
          >
            <input
              type="checkbox"
              class="size-4 accent-brand-700"
              :checked="prayers.includes(p)"
              @change="togglePrayer(p, ($event.target as HTMLInputElement).checked)"
            />
            {{ PRAYER_LABELS[p] }}
          </label>
        </div>
        <p class="mt-2 text-xs text-stone-500 dark:text-stone-400">
          Pilihan ini berlaku untuk semua perangkat yang mengaktifkan notifikasi.
        </p>
      </fieldset>

      <p class="text-sm text-stone-600 dark:text-stone-300">
        Pengingat agenda diatur per agenda di
        <RouterLink to="/schedule" class="font-medium text-brand-700 underline dark:text-brand-300"
          >Jadwal</RouterLink
        >.
      </p>
    </div>
  </UiCard>
</template>
