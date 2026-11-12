<script setup lang="ts">
import { reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { loginSchema } from '@muhasabah/shared';
import { UiAlert, UiButton, UiInput, useZodForm } from '@/shared';
import { useSessionStore } from '../stores/session.store';

const session = useSessionStore();
const router = useRouter();
const route = useRoute();
const form = reactive({ email: '', password: '' });
const { errors, formError, submitting, submit } = useZodForm(loginSchema);

function onSubmit() {
  return submit(form, async (data) => {
    await session.login(data);
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/';
    await router.replace(redirect.startsWith('/') ? redirect : '/');
  });
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-semibold">Masuk</h1>
    <p class="mt-1 text-sm text-stone-500 dark:text-stone-400">Lanjutkan muhasabah harianmu.</p>

    <form class="mt-6 space-y-4" novalidate @submit.prevent="onSubmit">
      <UiAlert v-if="formError" tone="error">{{ formError }}</UiAlert>
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
        autocomplete="current-password"
        required
        :error="errors.password"
      />
      <UiButton type="submit" block :loading="submitting">Masuk</UiButton>
    </form>

    <p class="mt-6 text-center text-sm text-stone-600 dark:text-stone-400">
      Belum punya akun?
      <RouterLink to="/register" class="font-medium text-brand-700 underline dark:text-brand-500">
        Daftar
      </RouterLink>
    </p>
  </div>
</template>
