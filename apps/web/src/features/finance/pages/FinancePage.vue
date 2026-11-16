<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  addMonths,
  budgetGap,
  formatRupiah,
  monthOf,
  monthRange,
  monthSchema,
  type FinanceCategory,
  type FinanceMonthly,
  type FinancePlan,
  type FinanceSummary,
  type FinanceTemplateItem,
  type Transaction,
  type TransactionType,
} from '@muhasabah/shared';
import { useUserClock } from '@/features/auth';
import { COLOR_CLASSES, formatLongDate, UiAlert, UiButton, UiCard, UiIcon } from '@/shared';
import { budgetApi, financeApi } from '../api';
import CategoryBreakdown from '../components/CategoryBreakdown.vue';
import CategoryManagerDialog from '../components/CategoryManagerDialog.vue';
import MonthlyChart from '../components/MonthlyChart.vue';
import PlanDialog from '../components/PlanDialog.vue';
import PlansCard from '../components/PlansCard.vue';
import RealizeDialog from '../components/RealizeDialog.vue';
import TemplateDialog from '../components/TemplateDialog.vue';
import TransactionDialog from '../components/TransactionDialog.vue';
import { balanceLabel, monthLabel, percentChange, signedAmount } from '../format';

const route = useRoute();
const router = useRouter();
const { today } = useUserClock();
const thisMonth = computed(() => monthOf(today.value));

const month = computed(() => {
  const q = route.query.month;
  return typeof q === 'string' && monthSchema.safeParse(q).success ? q : thisMonth.value;
});
function goMonth(m: string) {
  router.replace({ query: { ...route.query, month: m === thisMonth.value ? undefined : m } });
}

type Filter = 'all' | TransactionType;
const filter = ref<Filter>('all');
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Semua' },
  { value: 'expense', label: 'Pengeluaran' },
  { value: 'income', label: 'Pemasukan' },
];
const breakdownType = ref<TransactionType>('expense');

const categories = ref<FinanceCategory[]>([]);
const summary = ref<FinanceSummary | null>(null);
const monthly = ref<FinanceMonthly | null>(null);
const items = ref<Transaction[]>([]);
const plans = ref<FinancePlan[]>([]);
const template = ref<FinanceTemplateItem[]>([]);
const nextCursor = ref<string | null>(null);
const loading = ref(true);
const loadingMore = ref(false);
const error = ref<string | null>(null);
const notice = ref<string | null>(null);

async function loadTransactions(append = false) {
  const res = await financeApi.transactions({
    month: month.value,
    type: filter.value === 'all' ? undefined : filter.value,
    cursor: append ? (nextCursor.value ?? undefined) : undefined,
    limit: 50,
  });
  items.value = append ? [...items.value, ...res.items] : res.items;
  nextCursor.value = res.nextCursor;
}

async function loadAll() {
  loading.value = true;
  error.value = null;
  try {
    const [cats, s, m, p, t] = await Promise.all([
      financeApi.categories(true),
      financeApi.summary(month.value),
      financeApi.monthly(maxMonth(month.value, thisMonth.value)),
      budgetApi.plans(month.value),
      budgetApi.template(),
      loadTransactions(),
    ]);
    categories.value = cats.items;
    summary.value = s;
    monthly.value = m;
    plans.value = p.items;
    template.value = t.items;
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat data keuangan';
  } finally {
    loading.value = false;
  }
}
const maxMonth = (a: string, b: string) => (a > b ? a : b);

async function loadMore() {
  loadingMore.value = true;
  try {
    await loadTransactions(true);
  } finally {
    loadingMore.value = false;
  }
}

watch(
  month,
  () => {
    notice.value = null;
    return loadAll();
  },
  { immediate: true },
);
watch(filter, () => loadTransactions().catch(() => undefined));

/** Transaksi dikelompokkan per tanggal, terbaru dulu. */
const groups = computed(() => {
  const map = new Map<string, Transaction[]>();
  for (const t of items.value) {
    const list = map.get(t.date) ?? [];
    list.push(t);
    map.set(t.date, list);
  }
  return [...map.entries()].map(([date, list]) => ({
    date,
    list,
    net: list.reduce((n, t) => n + (t.type === 'income' ? t.amount : -t.amount), 0),
  }));
});

const breakdown = computed(
  () => summary.value?.byCategory.filter((c) => c.type === breakdownType.value) ?? [],
);

const cards = computed(() => {
  const s = summary.value;
  if (!s) return [];
  const prevLabel = monthLabel(s.previous.month).split(' ')[0];
  const change = (cur: number, prev: number) => {
    const p = percentChange(cur, prev);
    return p === null ? null : `${p > 0 ? '↑' : p < 0 ? '↓' : ''}${Math.abs(p)}% dari ${prevLabel}`;
  };
  const rose = 'text-rose-700 dark:text-rose-400';
  /** Baris rencana vs real; `null` bila bulan ini tidak punya rencana untuk jenis itu. */
  const plan = (type: TransactionType) => {
    const planned = s.planned[type];
    if (!planned) return null;
    const actual = s[type];
    const gap = budgetGap(type, planned, actual);
    const gapText =
      type === 'expense'
        ? gap >= 0
          ? `Sisa ${formatRupiah(gap)}`
          : `Melebihi ${formatRupiah(-gap)}`
        : gap >= 0
          ? gap === 0
            ? 'Sesuai rencana'
            : `Lebih ${formatRupiah(gap)}`
          : `Kurang ${formatRupiah(-gap)}`;
    return {
      label: `${type === 'expense' ? 'Dialokasikan' : 'Rencana'} ${formatRupiah(planned)}`,
      gap: gapText,
      gapTone: gap < 0 ? rose : '',
      percent: Math.min(100, Math.round((actual / planned) * 100)),
      over: gap < 0 && type === 'expense',
    };
  };
  return [
    {
      key: 'income',
      label: 'Pemasukan',
      value: formatRupiah(s.income),
      note: change(s.income, s.previous.income),
      tone: '',
      plan: plan('income'),
    },
    {
      key: 'expense',
      label: 'Pengeluaran',
      value: formatRupiah(s.expense),
      note: change(s.expense, s.previous.expense),
      tone: '',
      plan: plan('expense'),
    },
    {
      key: 'balance',
      label: 'Selisih',
      value: balanceLabel(s.balance),
      note: s.balance < 0 ? 'Pengeluaran melebihi pemasukan' : `${s.transactionCount} transaksi`,
      tone: s.balance < 0 ? rose : '',
      plan:
        s.plans.total > 0
          ? {
              label: `Rencana ${balanceLabel(s.planned.balance)}`,
              gap: `${s.plans.done}/${s.plans.total} rencana tercatat`,
              gapTone: '',
              percent: null,
              over: false,
            }
          : null,
    },
  ];
});

// ---- Dialog
const dialogOpen = ref(false);
const editing = ref<Transaction | null>(null);
const newType = ref<TransactionType>('expense');
const categoriesOpen = ref(false);

/** Tanggal bawaan: hari ini bila bulan yang dibuka adalah bulan ini, selain itu tanggal 1. */
const defaultDate = computed(() =>
  month.value === thisMonth.value ? today.value : monthRange(month.value).from,
);

function openNew(type: TransactionType = 'expense') {
  editing.value = null;
  newType.value = type;
  dialogOpen.value = true;
}
function openEdit(t: Transaction) {
  editing.value = t;
  dialogOpen.value = true;
}
// ---- Rencana dan template
const templateOpen = ref(false);
const planOpen = ref(false);
const editingPlan = ref<FinancePlan | null>(null);
const realizeOpen = ref(false);
const realizing = ref<FinancePlan | null>(null);
const applying = ref(false);
const planBusyId = ref<string | null>(null);

async function applyTemplate() {
  applying.value = true;
  notice.value = null;
  error.value = null;
  try {
    const r = await budgetApi.applyTemplate(month.value);
    notice.value =
      r.created > 0
        ? `${r.created} rencana dari template ditambahkan ke ${monthLabel(month.value)}.`
        : 'Semua item template sudah ada di bulan ini.';
    await loadAll();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal menerapkan template';
  } finally {
    applying.value = false;
  }
}
function openPlan(p: FinancePlan | null) {
  editingPlan.value = p;
  planOpen.value = true;
}
function openRealize(p: FinancePlan) {
  realizing.value = p;
  realizeOpen.value = true;
}
async function unrealize(p: FinancePlan) {
  planBusyId.value = p.id;
  error.value = null;
  try {
    await budgetApi.unrealize(p.id);
    await loadAll();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal membatalkan';
  } finally {
    planBusyId.value = null;
  }
}

function onSaved(t: Transaction) {
  const m = monthOf(t.date);
  if (m !== month.value) goMonth(m);
  else loadAll();
}
</script>

<template>
  <div class="mx-auto max-w-5xl space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl font-semibold tracking-tight">Keuangan</h1>
        <p class="mt-1 text-sm text-stone-500 dark:text-stone-400">
          Rencanakan anggaran bulanan, catat yang benar-benar terjadi, dan lihat selisihnya.
        </p>
      </div>
      <div class="flex gap-2">
        <UiButton variant="secondary" @click="categoriesOpen = true">Kategori</UiButton>
        <UiButton @click="openNew()">
          <UiIcon path="M12 5v14M5 12h14" class="size-4" />
          Catat
        </UiButton>
      </div>
    </header>

    <div class="flex items-center gap-2">
      <button
        type="button"
        class="rounded-full p-2 hover:bg-stone-100 dark:hover:bg-stone-800"
        aria-label="Bulan sebelumnya"
        @click="goMonth(addMonths(month, -1))"
      >
        <UiIcon path="M15 18l-6-6 6-6" class="size-5" />
      </button>
      <h2 class="min-w-40 text-center font-display text-xl font-semibold" aria-live="polite">
        {{ monthLabel(month) }}
      </h2>
      <button
        type="button"
        class="rounded-full p-2 hover:bg-stone-100 dark:hover:bg-stone-800"
        aria-label="Bulan berikutnya"
        @click="goMonth(addMonths(month, 1))"
      >
        <UiIcon path="M9 18l6-6-6-6" class="size-5" />
      </button>
      <UiButton v-if="month !== thisMonth" variant="ghost" @click="goMonth(thisMonth)">
        Bulan ini
      </UiButton>
    </div>

    <UiAlert v-if="error" tone="error">{{ error }}</UiAlert>
    <UiAlert v-if="notice" tone="success">{{ notice }}</UiAlert>

    <dl class="grid grid-cols-1 gap-3 sm:grid-cols-3" data-testid="finance-summary">
      <div
        v-for="c in cards"
        :key="c.key"
        class="rounded-3xl border border-stone-200/80 bg-white p-5 shadow-soft dark:border-stone-800 dark:bg-stone-900 dark:shadow-none"
      >
        <dt class="flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400">
          <span
            v-if="c.key === 'income' || c.key === 'expense'"
            :class="[
              'size-2.5 rounded-sm',
              c.key === 'income'
                ? 'bg-emerald-700 dark:bg-emerald-600'
                : 'bg-amber-500 dark:bg-amber-600',
            ]"
          />
          {{ c.label }}
        </dt>
        <dd
          :class="['mt-1 text-2xl font-semibold tabular-nums', c.tone]"
          :data-testid="`finance-${c.key}`"
        >
          {{ c.value }}
        </dd>
        <dd
          v-if="c.plan"
          class="mt-2 space-y-1 text-xs text-stone-500 dark:text-stone-400"
          :data-testid="`finance-${c.key}-plan`"
        >
          <div
            v-if="c.plan.percent !== null"
            class="h-1.5 rounded-full bg-stone-100 dark:bg-stone-800"
            aria-hidden="true"
          >
            <div
              :class="[
                'h-full rounded-full',
                c.plan.over
                  ? 'bg-rose-600 dark:bg-rose-500'
                  : c.key === 'income'
                    ? 'bg-emerald-700 dark:bg-emerald-600'
                    : 'bg-amber-500 dark:bg-amber-600',
              ]"
              :style="{ width: `${c.plan.percent}%` }"
            />
          </div>
          <p class="flex flex-wrap justify-between gap-x-2">
            <span>{{ c.plan.label }}</span>
            <span :class="['font-medium', c.plan.gapTone]">{{ c.plan.gap }}</span>
          </p>
        </dd>
        <dd v-else-if="c.note" class="mt-1 text-xs text-stone-500 dark:text-stone-400">
          {{ c.note }}
        </dd>
      </div>
    </dl>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-[1.25fr_1fr]">
      <div class="min-w-0 space-y-6">
        <PlansCard
          :plans="plans"
          :template-count="template.length"
          :today="today"
          :month-name="monthLabel(month)"
          :applying="applying"
          :busy-id="planBusyId"
          @apply="applyTemplate"
          @add="openPlan(null)"
          @template="templateOpen = true"
          @edit="openPlan"
          @realize="openRealize"
          @unrealize="unrealize"
        />
        <UiCard title="Transaksi">
          <div
            role="group"
            aria-label="Saring transaksi"
            class="mb-4 flex w-full rounded-full bg-stone-100 p-1 text-sm dark:bg-stone-800"
          >
            <button
              v-for="f in FILTERS"
              :key="f.value"
              type="button"
              :aria-pressed="filter === f.value"
              :class="[
                'flex-1 rounded-full px-3 py-1',
                filter === f.value
                  ? 'bg-white font-medium shadow-xs dark:bg-stone-700'
                  : 'text-stone-600 dark:text-stone-400',
              ]"
              @click="filter = f.value"
            >
              {{ f.label }}
            </button>
          </div>

          <div v-if="groups.length" class="space-y-4">
            <section v-for="g in groups" :key="g.date">
              <h3
                class="flex justify-between border-b border-stone-100 pb-1 text-xs font-medium text-stone-500 dark:border-stone-800 dark:text-stone-400"
              >
                <span>{{ formatLongDate(g.date) }}</span>
                <span class="tabular-nums">{{ balanceLabel(g.net) }}</span>
              </h3>
              <ul>
                <li v-for="t in g.list" :key="t.id">
                  <button
                    type="button"
                    class="-mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-xl px-2 py-2 text-left text-sm hover:bg-stone-50 dark:hover:bg-stone-800/60"
                    @click="openEdit(t)"
                  >
                    <span class="sr-only">Ubah transaksi:</span>
                    <span
                      :class="[
                        'size-2.5 shrink-0 rounded-full',
                        COLOR_CLASSES[t.category.color].dot,
                      ]"
                    />
                    <span class="min-w-0 flex-1">
                      <span class="block truncate font-medium">{{ t.category.name }}</span>
                      <span
                        v-if="t.note || t.planId"
                        class="block truncate text-xs text-stone-500 dark:text-stone-400"
                        >{{
                          [t.planId ? 'Dari rencana' : null, t.note].filter(Boolean).join(' · ')
                        }}</span
                      >
                    </span>
                    <span
                      :class="[
                        'shrink-0 font-medium tabular-nums',
                        t.type === 'income' && 'text-emerald-700 dark:text-emerald-400',
                      ]"
                    >
                      {{ signedAmount(t.type, t.amount) }}
                    </span>
                  </button>
                </li>
              </ul>
            </section>
            <UiButton
              v-if="nextCursor"
              variant="secondary"
              block
              :loading="loadingMore"
              @click="loadMore"
            >
              Muat lebih banyak
            </UiButton>
          </div>
          <div
            v-else-if="!loading"
            class="py-6 text-center text-sm text-stone-500 dark:text-stone-400"
          >
            <p>Belum ada transaksi di {{ monthLabel(month) }}.</p>
            <div class="mt-3 flex justify-center gap-2">
              <UiButton variant="secondary" @click="openNew('income')">Catat pemasukan</UiButton>
              <UiButton variant="secondary" @click="openNew('expense')">Catat pengeluaran</UiButton>
            </div>
          </div>
        </UiCard>
      </div>

      <div class="min-w-0 space-y-6">
        <UiCard title="Per kategori">
          <template #actions>
            <div
              role="group"
              aria-label="Jenis rincian"
              class="flex rounded-full bg-stone-100 p-1 text-sm dark:bg-stone-800"
            >
              <button
                v-for="t in ['expense', 'income'] as const"
                :key="t"
                type="button"
                :aria-pressed="breakdownType === t"
                :class="[
                  'rounded-full px-3 py-1',
                  breakdownType === t
                    ? 'bg-white font-medium shadow-xs dark:bg-stone-700'
                    : 'text-stone-600 dark:text-stone-400',
                ]"
                @click="breakdownType = t"
              >
                {{ t === 'expense' ? 'Keluar' : 'Masuk' }}
              </button>
            </div>
          </template>
          <CategoryBreakdown
            :items="breakdown"
            :empty-text="
              breakdownType === 'expense'
                ? 'Belum ada pengeluaran bulan ini.'
                : 'Belum ada pemasukan bulan ini.'
            "
          />
        </UiCard>

        <UiCard
          v-if="monthly"
          title="12 bulan terakhir"
          description="Pilih bulan pada grafik untuk membukanya."
        >
          <MonthlyChart :months="monthly.months" :current="month" @select="goMonth" />
        </UiCard>
      </div>
    </div>

    <TransactionDialog
      v-model:open="dialogOpen"
      :transaction="editing"
      :categories="categories"
      :default-date="defaultDate"
      :default-type="newType"
      @saved="onSaved"
      @deleted="loadAll"
    />
    <CategoryManagerDialog v-model:open="categoriesOpen" @changed="loadAll" />
    <TemplateDialog
      v-model:open="templateOpen"
      :categories="categories"
      @changed="(t) => (template = t)"
    />
    <PlanDialog
      v-model:open="planOpen"
      :plan="editingPlan"
      :categories="categories"
      :default-date="defaultDate"
      @changed="loadAll"
    />
    <RealizeDialog v-model:open="realizeOpen" :plan="realizing" :today="today" @changed="loadAll" />
  </div>
</template>
