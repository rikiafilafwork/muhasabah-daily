<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue';

/**
 * Pilihan berbentuk listbox kustom (pola ARIA combobox + listbox) agar tampilan daftar
 * konsisten dengan tema, termasuk mode gelap. Daftar panjang otomatis mendapat kolom cari.
 */
const props = withDefaults(
  defineProps<{
    label: string;
    options: { value: string; label: string }[];
    placeholder?: string;
    hideLabel?: boolean;
    /** Tampilkan kolom cari; bawaan otomatis bila opsi lebih dari 8. */
    searchable?: boolean;
  }>(),
  { placeholder: '', hideLabel: false, searchable: undefined },
);
const emit = defineEmits<{ change: [value: string] }>();
const model = defineModel<string>({ required: true });

const id = useId();
const labelId = `${id}-label`;
const valueId = `${id}-value`;
const listId = `${id}-list`;

const open = ref(false);
const openUp = ref(false);
const query = ref('');
const active = ref(-1);
const root = ref<HTMLElement | null>(null);
const trigger = ref<HTMLButtonElement | null>(null);
const list = ref<HTMLUListElement | null>(null);
const search = ref<HTMLInputElement | null>(null);

const canSearch = computed(() => props.searchable ?? props.options.length > 8);
const selected = computed(() => props.options.find((o) => o.value === model.value));
const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  return q ? props.options.filter((o) => o.label.toLowerCase().includes(q)) : props.options;
});
const optionId = (i: number) => `${id}-opt-${i}`;

async function show() {
  if (open.value) return;
  const rect = trigger.value?.getBoundingClientRect();
  openUp.value = !!rect && window.innerHeight - rect.bottom < 280 && rect.top > 280;
  query.value = '';
  open.value = true;
  active.value = Math.max(
    0,
    filtered.value.findIndex((o) => o.value === model.value),
  );
  await nextTick();
  (canSearch.value ? search.value : list.value)?.focus();
  scrollActive();
}

function hide(refocus = true) {
  if (!open.value) return;
  open.value = false;
  if (refocus) trigger.value?.focus();
}

function choose(i: number) {
  const o = filtered.value[i];
  if (!o) return;
  if (o.value !== model.value) {
    model.value = o.value;
    emit('change', o.value);
  }
  hide();
}

function scrollActive() {
  nextTick(() => {
    list.value
      ?.querySelector<HTMLElement>(`#${CSS.escape(optionId(active.value))}`)
      ?.scrollIntoView({ block: 'nearest' });
  });
}

function move(delta: number) {
  const n = filtered.value.length;
  if (!n) return;
  active.value = (active.value + delta + n) % n;
  scrollActive();
}

function onListKey(e: KeyboardEvent) {
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      move(1);
      break;
    case 'ArrowUp':
      e.preventDefault();
      move(-1);
      break;
    case 'Home':
      if (canSearch.value) return;
      e.preventDefault();
      active.value = 0;
      scrollActive();
      break;
    case 'End':
      if (canSearch.value) return;
      e.preventDefault();
      active.value = filtered.value.length - 1;
      scrollActive();
      break;
    case 'Enter':
    case ' ':
      if (e.key === ' ' && canSearch.value) return;
      e.preventDefault();
      choose(active.value);
      break;
    case 'Escape':
      e.preventDefault();
      e.stopPropagation(); // jangan menutup dialog induk
      hide();
      break;
    case 'Tab':
      hide(false);
      break;
    default:
      // Lompat ke opsi berawalan huruf yang diketik (tanpa kolom cari).
      if (!canSearch.value && e.key.length === 1) {
        const k = e.key.toLowerCase();
        const i = filtered.value.findIndex(
          (o, idx) => idx > active.value && o.label.toLowerCase().startsWith(k),
        );
        const j = i >= 0 ? i : filtered.value.findIndex((o) => o.label.toLowerCase().startsWith(k));
        if (j >= 0) {
          active.value = j;
          scrollActive();
        }
      }
  }
}

function onTriggerKey(e: KeyboardEvent) {
  if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
    e.preventDefault();
    void show();
  }
}

watch(query, () => {
  active.value = filtered.value.length ? 0 : -1;
});

function onDocPointer(e: PointerEvent) {
  if (root.value && !root.value.contains(e.target as Node)) hide(false);
}
watch(open, (v) => {
  if (v) document.addEventListener('pointerdown', onDocPointer, true);
  else document.removeEventListener('pointerdown', onDocPointer, true);
});
onBeforeUnmount(() => document.removeEventListener('pointerdown', onDocPointer, true));
</script>

<template>
  <div ref="root" class="relative space-y-1">
    <label
      :id="labelId"
      :for="id"
      :class="[
        'block text-sm font-medium text-stone-700 dark:text-stone-300',
        hideLabel && 'sr-only',
      ]"
    >
      {{ label }}
    </label>
    <button
      :id="id"
      ref="trigger"
      type="button"
      role="combobox"
      aria-haspopup="listbox"
      :aria-expanded="open"
      :aria-controls="listId"
      :aria-labelledby="`${labelId} ${valueId}`"
      :class="[
        'flex w-full items-center justify-between gap-2 rounded-xl border bg-white px-3.5 py-2.5 text-left text-sm shadow-xs transition dark:bg-stone-950',
        open
          ? 'border-brand-600 ring-4 ring-brand-600/15'
          : 'border-stone-300 hover:border-stone-400 dark:border-stone-700 dark:hover:border-stone-600',
      ]"
      @click="open ? hide() : show()"
      @keydown="onTriggerKey"
    >
      <span
        :id="valueId"
        :class="[
          'min-w-0 truncate',
          selected ? 'text-stone-900 dark:text-stone-100' : 'text-stone-500 dark:text-stone-400',
        ]"
      >
        {{ selected?.label || placeholder || 'Pilih…' }}
      </span>
      <svg
        :class="['size-4 shrink-0 text-stone-500 transition-transform', open && 'rotate-180']"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </button>

    <div
      v-if="open"
      :class="[
        'absolute inset-x-0 z-50 animate-pop overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-soft dark:border-stone-700 dark:bg-stone-900 dark:shadow-black/40',
        openUp ? 'bottom-full mb-1' : 'top-full mt-1',
      ]"
    >
      <div v-if="canSearch" class="border-b border-stone-200 p-2 dark:border-stone-700">
        <input
          ref="search"
          v-model="query"
          type="text"
          role="searchbox"
          :aria-label="`Cari ${label.toLowerCase()}`"
          :aria-controls="listId"
          :aria-activedescendant="active >= 0 ? optionId(active) : undefined"
          placeholder="Cari…"
          autocomplete="off"
          class="block w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-sm placeholder:text-stone-500 focus:border-brand-600 focus:outline-none dark:border-stone-700 dark:bg-stone-950 dark:placeholder:text-stone-400"
          @keydown="onListKey"
        />
      </div>
      <ul
        :id="listId"
        ref="list"
        role="listbox"
        :aria-labelledby="labelId"
        :tabindex="canSearch ? undefined : -1"
        :aria-activedescendant="!canSearch && active >= 0 ? optionId(active) : undefined"
        class="max-h-64 overflow-y-auto overscroll-contain p-1 focus:outline-none"
        @keydown="onListKey"
      >
        <li
          v-for="(o, i) in filtered"
          :id="optionId(i)"
          :key="o.value"
          role="option"
          :aria-selected="o.value === model"
          :class="[
            'flex cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm',
            i === active && 'bg-stone-100 dark:bg-stone-800',
            o.value === model
              ? 'font-medium text-brand-800 dark:text-brand-300'
              : 'text-stone-700 dark:text-stone-200',
          ]"
          @mouseenter="active = i"
          @click="choose(i)"
        >
          <span class="min-w-0 truncate">{{ o.label }}</span>
          <svg
            v-if="o.value === model"
            class="size-4 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.25"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M5 13l4 4L19 7" />
          </svg>
        </li>
        <li
          v-if="!filtered.length"
          class="px-3 py-2 text-sm text-stone-500 dark:text-stone-400"
          role="presentation"
        >
          Tidak ditemukan.
        </li>
      </ul>
    </div>
  </div>
</template>
