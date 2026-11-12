import { ref, watch } from 'vue';
import type { Theme } from '@muhasabah/shared';

const STORAGE_KEY = 'md-theme';

function readStored(): Theme {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'light' || v === 'dark' || v === 'system' ? v : 'system';
  } catch {
    return 'system';
  }
}

const theme = ref<Theme>(readStored());
const media =
  typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null;

function apply() {
  const dark = theme.value === 'dark' || (theme.value === 'system' && !!media?.matches);
  document.documentElement.classList.toggle('dark', dark);
}

let initialized = false;

/**
 * Tema aplikasi: kelas `dark` pada `<html>`. Preferensi utama disimpan di profil
 * pengguna; localStorage hanya cadangan agar halaman masuk mengikuti pilihan terakhir.
 */
export function useTheme() {
  if (!initialized && typeof window !== 'undefined') {
    initialized = true;
    media?.addEventListener('change', apply);
    watch(
      theme,
      (t) => {
        try {
          localStorage.setItem(STORAGE_KEY, t);
        } catch {
          /* abaikan */
        }
        apply();
      },
      { immediate: true },
    );
  }
  return {
    theme,
    setTheme: (t: Theme) => {
      theme.value = t;
    },
  };
}
