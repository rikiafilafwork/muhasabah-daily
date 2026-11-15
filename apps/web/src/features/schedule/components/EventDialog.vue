<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import {
  addDays,
  createEventSchema,
  EVENT_REMINDER_MINUTES,
  eventReminderLabel,
  toLocalDate,
  toLocalTime,
  zonedTimeToUtc,
  type CalendarEvent,
  type Color,
} from '@muhasabah/shared';
import {
  UiAlert,
  UiButton,
  UiColorPicker,
  UiDialog,
  UiInput,
  UiSelect,
  UiTextarea,
  useZodForm,
} from '@/shared';
import { eventsApi } from '../api';

const props = defineProps<{ event: CalendarEvent | null; date: string; timezone: string }>();
const open = defineModel<boolean>('open', { required: true });
const emit = defineEmits<{ changed: [] }>();

const form = reactive({
  title: '',
  location: '',
  description: '',
  allDay: false,
  startDate: '',
  startTime: '09:00',
  endDate: '',
  endTime: '10:00',
  color: 'emerald' as Color,
  reminder: 'none',
});
const reminderOptions = [
  { value: 'none', label: eventReminderLabel(null) },
  ...EVENT_REMINDER_MINUTES.map((m) => ({ value: String(m), label: eventReminderLabel(m) })),
];
const { errors, formError, submitting, submit } = useZodForm(createEventSchema);
const deleting = ref(false);

watch(open, (v) => {
  if (!v) return;
  const e = props.event;
  const tz = props.timezone;
  form.title = e?.title ?? '';
  form.location = e?.location ?? '';
  form.description = e?.description ?? '';
  form.allDay = e?.allDay ?? false;
  form.color = e?.color ?? 'emerald';
  form.reminder = e?.reminderMinutes == null ? 'none' : String(e.reminderMinutes);
  if (e) {
    const start = new Date(e.startAt);
    // Akhir sepanjang hari bersifat eksklusif; tampilkan tanggal terakhirnya.
    const end = new Date(e.allDay ? Date.parse(e.endAt) - 1 : Date.parse(e.endAt));
    form.startDate = toLocalDate(start, tz);
    form.startTime = toLocalTime(start, tz);
    form.endDate = toLocalDate(end, tz);
    form.endTime = toLocalTime(end, tz);
  } else {
    form.startDate = props.date;
    form.endDate = props.date;
    form.startTime = '09:00';
    form.endTime = '10:00';
  }
});

watch(
  () => form.startDate,
  (d, prev) => {
    // Geser tanggal selesai bersama tanggal mulai agar tidak berakhir sebelum mulai.
    if (prev && d && form.endDate && form.endDate < d) form.endDate = d;
  },
);

function onSubmit() {
  const tz = props.timezone;
  const startAt = form.allDay
    ? zonedTimeToUtc(form.startDate, '00:00', tz)
    : zonedTimeToUtc(form.startDate, form.startTime, tz);
  const endAt = form.allDay
    ? zonedTimeToUtc(addDays(form.endDate || form.startDate, 1), '00:00', tz)
    : zonedTimeToUtc(form.endDate || form.startDate, form.endTime, tz);
  const values = {
    title: form.title,
    location: form.location.trim() || null,
    description: form.description.trim() || null,
    allDay: form.allDay,
    color: form.color,
    reminderMinutes: form.reminder === 'none' ? null : Number(form.reminder),
    startAt: Number.isNaN(startAt.getTime()) ? '' : startAt.toISOString(),
    endAt: Number.isNaN(endAt.getTime()) ? '' : endAt.toISOString(),
  };
  return submit(values, async (data) => {
    if (props.event) await eventsApi.update(props.event.id, data);
    else await eventsApi.create(data);
    emit('changed');
    open.value = false;
  });
}

async function onDelete() {
  if (!props.event) return;
  deleting.value = true;
  try {
    await eventsApi.remove(props.event.id);
    emit('changed');
    open.value = false;
  } finally {
    deleting.value = false;
  }
}
</script>

<template>
  <UiDialog v-model:open="open" :title="event ? 'Ubah agenda' : 'Agenda baru'">
    <form class="space-y-4" novalidate @submit.prevent="onSubmit">
      <UiAlert v-if="formError" tone="error">{{ formError }}</UiAlert>
      <UiInput v-model="form.title" label="Judul" required :error="errors.title" />
      <label class="flex items-center gap-2 text-sm">
        <input v-model="form.allDay" type="checkbox" class="size-4 accent-brand-700" />
        Sepanjang hari
      </label>
      <div class="grid grid-cols-2 gap-3">
        <UiInput
          v-model="form.startDate"
          label="Tanggal mulai"
          type="date"
          :error="errors.startAt"
        />
        <UiInput v-if="!form.allDay" v-model="form.startTime" label="Jam mulai" type="time" />
        <UiInput v-model="form.endDate" label="Tanggal selesai" type="date" :error="errors.endAt" />
        <UiInput v-if="!form.allDay" v-model="form.endTime" label="Jam selesai" type="time" />
      </div>
      <p class="-mt-2 text-xs text-stone-500 dark:text-stone-400">Zona waktu: {{ timezone }}</p>
      <UiInput v-model="form.location" label="Lokasi (opsional)" :error="errors.location" />
      <UiTextarea
        v-model="form.description"
        label="Catatan (opsional)"
        :rows="2"
        :error="errors.description"
      />
      <UiSelect v-model="form.reminder" label="Pengingat" :options="reminderOptions" />
      <UiColorPicker v-model="form.color" />
      <div class="flex items-center justify-between gap-2 pt-2">
        <UiButton v-if="event" variant="ghost" :loading="deleting" @click="onDelete"
          >Hapus</UiButton
        >
        <span v-else />
        <div class="flex gap-2">
          <UiButton variant="secondary" @click="open = false">Batal</UiButton>
          <UiButton type="submit" :loading="submitting">Simpan</UiButton>
        </div>
      </div>
    </form>
  </UiDialog>
</template>
