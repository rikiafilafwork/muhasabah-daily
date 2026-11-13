<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { THEMES, updateProfileSchema, type Theme } from '@muhasabah/shared';
import { useSessionStore } from '@/features/auth';
import {
  CITY_PRESETS,
  timezoneOptions,
  UiAlert,
  UiButton,
  UiCard,
  UiInput,
  UiSelect,
  useTheme,
  useZodForm,
} from '@/shared';
import { profileApi } from '../api';

const session = useSessionStore();
const version = __APP_VERSION__;
const route = useRoute();
const router = useRouter();
const { setTheme } = useTheme();
const user = computed(() => session.user!);

const form = reactive({
  name: user.value.name,
  city: user.value.city ?? '',
  latitude: user.value.latitude?.toString() ?? '',
  longitude: user.value.longitude?.toString() ?? '',
  timezone: user.value.timezone,
  theme: user.value.theme as Theme,
});
const preset = ref('');
const saved = ref(false);
const geoError = ref<string | null>(null);
const locating = ref(false);
// Penyiapan awal setelah daftar: setelah lokasi disimpan, arahkan ke Beranda.
const firstSetup = route.query.welcome === '1' && user.value.latitude == null;
const welcome = computed(() => firstSetup && user.value.latitude == null);
const tzOptions = timezoneOptions();
const themeLabels: Record<Theme, string> = {
  light: 'Terang',
  dark: 'Gelap',
  system: 'Ikuti sistem',
};

const { errors, formError, submitting, submit } = useZodForm(updateProfileSchema);

function applyPreset() {
  const city = CITY_PRESETS.find((c) => c.name === preset.value);
  if (!city) return;
  form.city = city.name;
  form.latitude = String(city.latitude);
  form.longitude = String(city.longitude);
  form.timezone = city.timezone;
}

function useMyLocation() {
  geoError.value = null;
  if (!('geolocation' in navigator)) {
    geoError.value = 'Browser tidak mendukung geolokasi.';
    return;
  }
  locating.value = true;
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      form.latitude = pos.coords.latitude.toFixed(4);
      form.longitude = pos.coords.longitude.toFixed(4);
      try {
        form.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      } catch {
        /* biarkan */
      }
      locating.value = false;
    },
    (err) => {
      geoError.value =
        err.code === err.PERMISSION_DENIED
          ? 'Izin lokasi ditolak. Pilih kota atau isi koordinat manual.'
          : 'Lokasi tidak dapat ditentukan.';
      locating.value = false;
    },
    { enableHighAccuracy: false, timeout: 10_000 },
  );
}

function toNumberOrNull(v: string): number | null | typeof NaN {
  const t = v.trim().replace(',', '.');
  return t === '' ? null : Number(t);
}

function onSubmit() {
  saved.value = false;
  const values = {
    name: form.name,
    city: form.city.trim() === '' ? null : form.city,
    latitude: toNumberOrNull(form.latitude),
    longitude: toNumberOrNull(form.longitude),
    timezone: form.timezone,
    theme: form.theme,
  };
  return submit(values, async (data) => {
    session.setUser(await profileApi.update(data));
    saved.value = true;
    if (firstSetup && data.latitude != null) await router.replace({ name: 'dashboard' });
  });
}

function previewTheme(t: Theme) {
  form.theme = t;
  setTheme(t);
}

// Hapus akun: konfirmasi dengan mengetik email, tanpa dialog browser.
const confirmEmail = ref('');
const deleting = ref(false);
const deleteError = ref<string | null>(null);
async function deleteAccount() {
  if (confirmEmail.value.trim().toLowerCase() !== user.value.email) return;
  deleting.value = true;
  deleteError.value = null;
  try {
    await profileApi.remove();
    session.clear();
    await router.replace({ name: 'login' });
  } catch (err) {
    deleteError.value = err instanceof Error ? err.message : 'Gagal menghapus akun';
  } finally {
    deleting.value = false;
  }
}
</script>

<template>
  <div class="mx-auto max-w-2xl space-y-6">
    <header>
      <h1 class="text-2xl font-semibold">Pengaturan</h1>
      <p class="mt-1 text-sm text-stone-500 dark:text-stone-400">Profil, lokasi, dan tampilan.</p>
    </header>

    <UiAlert v-if="welcome" tone="info">
      Selamat datang! Atur lokasi agar jadwal sholat bisa ditampilkan.
    </UiAlert>

    <form class="space-y-6" novalidate @submit.prevent="onSubmit">
      <UiAlert v-if="formError" tone="error">{{ formError }}</UiAlert>
      <UiAlert v-if="saved" tone="success">Pengaturan tersimpan.</UiAlert>

      <UiCard title="Profil">
        <UiInput v-model="form.name" label="Nama" autocomplete="name" :error="errors.name" />
        <p class="mt-3 text-sm text-stone-500 dark:text-stone-400">Email: {{ user.email }}</p>
      </UiCard>

      <UiCard
        title="Lokasi dan zona waktu"
        description="Dipakai untuk menghitung waktu sholat (metode Kemenag RI)."
      >
        <div class="space-y-4">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div class="flex-1">
              <UiSelect
                v-model="preset"
                label="Pilih kota"
                placeholder="Pilih kota di Indonesia…"
                :options="CITY_PRESETS.map((c) => ({ value: c.name, label: c.name }))"
                @change="applyPreset"
              />
            </div>
            <UiButton variant="secondary" :loading="locating" @click="useMyLocation">
              Gunakan lokasi saya
            </UiButton>
          </div>
          <UiAlert v-if="geoError" tone="warning">{{ geoError }}</UiAlert>

          <UiInput v-model="form.city" label="Nama kota (opsional)" :error="errors.city" />
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <UiInput
              v-model="form.latitude"
              label="Lintang (latitude)"
              inputmode="decimal"
              hint="Contoh: -6.2088"
              :error="errors.latitude"
            />
            <UiInput
              v-model="form.longitude"
              label="Bujur (longitude)"
              inputmode="decimal"
              hint="Contoh: 106.8456"
              :error="errors.longitude"
            />
          </div>
          <UiSelect v-model="form.timezone" label="Zona waktu" :options="tzOptions" />
          <p v-if="errors.timezone" class="text-sm text-red-700">{{ errors.timezone }}</p>
        </div>
      </UiCard>

      <UiCard title="Tampilan">
        <fieldset>
          <legend class="sr-only">Tema</legend>
          <div class="grid grid-cols-3 gap-2">
            <label
              v-for="t in THEMES"
              :key="t"
              :class="[
                'flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2 text-sm has-focus-visible:outline-2 has-focus-visible:outline-brand-600',
                form.theme === t
                  ? 'border-brand-600 bg-brand-50 font-medium text-brand-800 dark:bg-brand-900/40 dark:text-brand-100'
                  : 'border-stone-300 dark:border-stone-700',
              ]"
            >
              <input
                type="radio"
                name="theme"
                class="sr-only"
                :value="t"
                :checked="form.theme === t"
                @change="previewTheme(t)"
              />
              {{ themeLabels[t] }}
            </label>
          </div>
        </fieldset>
      </UiCard>

      <div class="flex justify-end">
        <UiButton type="submit" :loading="submitting">Simpan pengaturan</UiButton>
      </div>
    </form>

    <UiCard
      title="Hapus akun"
      description="Menghapus akun beserta seluruh datamu secara permanen. Tindakan ini tidak bisa dibatalkan."
    >
      <form class="space-y-3" @submit.prevent="deleteAccount">
        <UiAlert v-if="deleteError" tone="error">{{ deleteError }}</UiAlert>
        <UiInput
          v-model="confirmEmail"
          label="Ketik email kamu untuk konfirmasi"
          autocomplete="off"
        />
        <UiButton
          type="submit"
          variant="danger"
          :loading="deleting"
          :disabled="confirmEmail.trim().toLowerCase() !== user.email"
        >
          Hapus akun permanen
        </UiButton>
      </form>
    </UiCard>

    <footer class="space-y-1 pb-4 text-center text-xs text-stone-500 dark:text-stone-400">
      <p>Muhasabah Daily v{{ version }} · open source (MIT), berjalan di server lokalmu sendiri.</p>
      <p>
        Waktu sholat: AlAdhan (metode Kemenag RI). Ayat: AlQuran Cloud. Rujukan dzikir dan habit
        ditampilkan bersama kontennya.
      </p>
    </footer>
  </div>
</template>
