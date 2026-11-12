import { reactive, ref } from 'vue';
import type { z } from 'zod';
import { ApiError } from '@/api/http';

/** Validasi form dengan skema zod bersama dan pemetaan error API ke field. */
export function useZodForm<S extends z.ZodType>(schema: S) {
  const errors = reactive<Record<string, string | undefined>>({});
  const formError = ref<string | null>(null);
  const submitting = ref(false);

  function reset() {
    for (const k of Object.keys(errors)) errors[k] = undefined;
    formError.value = null;
  }

  async function submit(values: unknown, action: (data: z.output<S>) => Promise<void>) {
    reset();
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? '_');
        errors[key] ??= issue.message;
      }
      return;
    }
    submitting.value = true;
    try {
      await action(parsed.data);
    } catch (err) {
      if (err instanceof ApiError && Array.isArray(err.details)) {
        for (const d of err.details as { path: string; message: string }[])
          errors[d.path] = d.message;
      }
      formError.value = err instanceof Error ? err.message : 'Terjadi kesalahan';
    } finally {
      submitting.value = false;
    }
  }

  return { errors, formError, submitting, submit, reset };
}
