<script setup lang="ts">
import { reactive } from 'vue';
import { useRouter } from 'vue-router';
import { PASSWORD_MIN_LENGTH, registerSchema } from '@muhasabah/shared';
import { UiAlert, UiButton, UiInput, useZodForm } from '@/shared';
import { useSessionStore } from '../stores/session.store';

const session = useSessionStore();
const router = useRouter();
const form = reactive({ name: '', email: '', password: '' });
const { errors, formError, submitting, submit } = useZodForm(registerSchema);

function browserTimezone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
}

function onSubmit() {
  return submit({ ...form, timezone: browserTimezone() }, async (data) => {
    await session.register(data);
    await router.replace({ name: 'settings', query: { welcome: '1' } });
  });
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-semibold">Buat akun</h1>
    <p class="mt-1 text-sm text-stone-500 dark:text-stone-400">
      Data tersimpan di server lokalmu sendiri.
    </p>

    <form class="mt-6 space-y-4" novalidate @submit.prevent="onSubmit">
      <UiAlert v-if="formError" tone="error">{{ formError }}</UiAlert>
      <UiInput v-model="form.name" label="Nama" autocomplete="name" required :error="errors.name" />
      <UiInput
        v-model="form.email"
        label="Email"
        type="email"
        autocomplete="email"
        inputmode="email"
        required
        :error="errors.email"
      />
      <UiInput
        v-model="form.password"
        label="Kata sandi"
        type="password"
        autocomplete="new-password"
        required
        :hint="`Minimal ${PASSWORD_MIN_LENGTH} karakter`"
        :error="errors.password"
      />
      <UiButton type="submit" block :loading="submitting">Daftar</UiButton>
    </form>

    <p class="mt-6 text-center text-sm text-stone-600 dark:text-stone-400">
      Sudah punya akun?
      <RouterLink to="/login" class="font-medium text-brand-700 underline dark:text-brand-500">
        Masuk
      </RouterLink>
    </p>
  </div>
</template>
