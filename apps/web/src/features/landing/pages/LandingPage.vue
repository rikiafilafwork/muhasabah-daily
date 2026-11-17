<script setup lang="ts">
import { ref } from 'vue';
import ThemeToggle from '@/app/components/ThemeToggle.vue';
import { UiIcon } from '@/shared';

const REPO_URL = 'https://github.com/rikiafilafwork/muhasabah-daily';

const FEATURES = [
  {
    title: 'Waktu sholat',
    text: 'Jadwal metode Kemenag RI dengan hitung mundur ke sholat berikutnya, tetap tampil saat sumber tidak bisa dihubungi.',
    icon: 'M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
  },
  {
    title: 'Jadwal',
    text: 'Tampilan hari, minggu, dan bulan. Waktu sholat disisipkan di antara agenda agar hari tersusun di sekitarnya.',
    icon: 'M4 5h16v16H4zM4 9h16M8 3v4M16 3v4',
  },
  {
    title: 'To-Do',
    text: 'Proyek, prioritas, tenggat, dan "fokus hari ini" yang kedaluwarsa sendiri saat hari berganti.',
    icon: 'M9 11l3 3 8-8M4 12v7h14',
  },
  {
    title: 'Habit',
    text: '46 template siap pakai, grid mingguan, serta insight streak dan konsistensi.',
    icon: 'M5 13l4 4L19 7',
  },
  {
    title: 'Goals',
    text: 'Target terukur yang progresnya ikut bergerak dari centang habit yang ditautkan.',
    icon: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm0-5a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  },
  {
    title: 'Fokus',
    text: 'Timer 25/5, 50/10, dan 15/3 yang tetap akurat saat tab berpindah, dengan pengingat waktu sholat.',
    icon: 'M13 2 4 14h7l-1 8 9-12h-7z',
  },
  {
    title: 'Dzikir',
    text: 'Pagi, petang, dan sebelum tidur: teks Arab, latin, terjemah, dan penghitung yang tetap jalan saat offline.',
    icon: 'M12 3a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm0 6v12M7 14h10',
  },
  {
    title: 'Hafidz',
    text: 'Rencana hafalan bertahap dengan pemutar murottal per ayat dan jadwal murajaah.',
    icon: 'M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2zM8 7h6',
  },
  {
    title: 'Jurnal & Kajian',
    text: 'Muhasabah harian dengan simpan otomatis, serta catatan kajian lengkap dengan rujukan ayat.',
    icon: 'M4 4h12l4 4v12H4zM8 12h8M8 16h5',
  },
  {
    title: 'Keuangan',
    text: 'Pemasukan dan pengeluaran per kategori, template bulanan, dan anggaran yang dibandingkan dengan realisasinya.',
    icon: 'M3 7a2 2 0 0 1 2-2h12v4M3 7v11a2 2 0 0 0 2 2h15V9H5a2 2 0 0 1-2-2zM16 14.5h.01',
  },
  {
    title: 'Pengingat',
    text: 'Notifikasi saat waktu sholat masuk dan sebelum agenda dimulai, walau tab sedang ditutup.',
    icon: 'M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21h4',
  },
  {
    title: 'Offline & bisa dipasang',
    text: 'Pasang sebagai aplikasi dari browser; data terakhir tetap bisa dibuka saat server tidak terjangkau.',
    icon: 'M12 3v12m0 0-4-4m4 4 4-4M5 21h14',
  },
];

const HIGHLIGHTS = [
  {
    eyebrow: 'Jadwal',
    title: 'Agenda yang tahu kapan waktunya sholat',
    text: 'Tampilan hari menyisipkan waktu sholat di antara agenda, jadi rencana kerja dan ibadah terlihat dalam satu garis waktu.',
    img: '/landing/jadwal-hari.png',
    height: 470,
    alt: 'Tampilan jadwal hari dengan waktu sholat di antara agenda',
  },
  {
    eyebrow: 'Habit',
    title: 'Kebiasaan baik yang terlihat perkembangannya',
    text: 'Centang harian, grid mingguan, dan insight streak, konsistensi, serta proyeksi minggu depan.',
    img: '/landing/habit.png',
    height: 860,
    alt: 'Grid habit mingguan dengan panel insight',
  },
  {
    eyebrow: 'Dzikir',
    title: 'Dzikir harian, juga saat sinyal hilang',
    text: 'Penghitung tetap berjalan tanpa koneksi dan tersinkron otomatis begitu kembali online. Mode gelap nyaman untuk dzikir malam.',
    img: '/landing/dzikir-gelap.png',
    height: 860,
    alt: 'Halaman dzikir pagi dalam mode gelap',
  },
];

const PRIVACY = [
  {
    title: 'Di servermu sendiri',
    text: 'Jurnal, tugas, dan habit tersimpan di basis data yang kamu jalankan sendiri, bukan di layanan pihak ketiga.',
    icon: 'M4 6h16v5H4zM4 13h16v5H4zM8 8.5h.01M8 15.5h.01',
  },
  {
    title: 'AI hanya bila diminta',
    text: 'AI Polish merapikan ejaan jurnal memakai kunci API milikmu, dan teks baru dikirim saat kamu menekan tombolnya.',
    icon: 'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z',
  },
  {
    title: 'Kode terbuka',
    text: 'Seluruh kode berlisensi MIT. Silakan periksa, ubah, dan sesuaikan dengan kebutuhanmu.',
    icon: 'M8 7l-5 5 5 5M16 7l5 5-5 5',
  },
];

const STEPS = [
  'git clone https://github.com/rikiafilafwork/muhasabah-daily.git',
  'cd muhasabah-daily',
  'docker compose up -d',
];

const copied = ref(false);
async function copySteps() {
  try {
    await navigator.clipboard.writeText(STEPS.join('\n'));
    copied.value = true;
    setTimeout(() => (copied.value = false), 2000);
  } catch {
    /* clipboard tidak tersedia */
  }
}
</script>

<template>
  <div class="relative min-h-dvh overflow-x-clip">
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:shadow-soft dark:focus:bg-stone-900"
    >
      Lewati ke konten
    </a>
    <div
      class="app-glow pointer-events-none absolute inset-x-0 top-0 h-[36rem]"
      aria-hidden="true"
    />

    <header
      class="sticky top-0 z-40 border-b border-stone-200/70 bg-stone-50/80 backdrop-blur-lg dark:border-stone-800/70 dark:bg-stone-950/75"
    >
      <div class="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <RouterLink to="/welcome" class="flex shrink-0 items-center gap-2.5">
          <img src="/favicon.svg" alt="" class="size-8" />
          <span class="font-display text-lg font-semibold tracking-tight">
            Muhasabah<span class="text-brand-700 dark:text-brand-400"> Daily</span>
          </span>
        </RouterLink>
        <nav aria-label="Bagian halaman" class="mx-auto hidden md:block">
          <ul
            class="flex items-center gap-6 text-sm font-medium text-stone-600 dark:text-stone-300"
          >
            <li><a href="#fitur" class="hover:text-stone-900 dark:hover:text-white">Fitur</a></li>
            <li>
              <a href="#privasi" class="hover:text-stone-900 dark:hover:text-white">Privasi</a>
            </li>
            <li>
              <a href="#mulai" class="hover:text-stone-900 dark:hover:text-white">Pasang sendiri</a>
            </li>
          </ul>
        </nav>
        <div class="ml-auto flex items-center gap-1 md:ml-0">
          <ThemeToggle />
          <RouterLink
            to="/login"
            class="rounded-full px-3.5 py-2 text-sm font-medium text-stone-700 hover:bg-stone-200/60 dark:text-stone-200 dark:hover:bg-stone-800"
          >
            Masuk
          </RouterLink>
          <RouterLink
            to="/register"
            class="hidden rounded-full bg-brand-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-800 sm:inline-flex"
          >
            Buat akun
          </RouterLink>
        </div>
      </div>
    </header>

    <main id="main" class="relative" tabindex="-1">
      <!-- Hero -->
      <section class="mx-auto max-w-6xl px-4 pt-14 pb-16 sm:px-6 lg:pt-20">
        <div class="mx-auto max-w-3xl text-center">
          <p
            class="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-800 dark:border-brand-800 dark:bg-brand-950 dark:text-brand-200"
          >
            <span class="size-1.5 rounded-full bg-gold-500" aria-hidden="true" />
            Open source · dipasang di servermu sendiri
          </p>
          <h1
            class="mt-6 text-4xl leading-tight font-semibold tracking-tight text-balance sm:text-6xl"
          >
            Hari yang tertata di sekitar
            <span class="text-brand-700 dark:text-brand-400">waktu sholat</span>.
          </h1>
          <p class="mx-auto mt-5 max-w-2xl text-lg text-pretty text-stone-600 dark:text-stone-300">
            Jadwal, to-do, habit, dzikir, hafalan, dan jurnal muhasabah dalam satu ruang pribadi.
            Rencanakan hari, jaga ibadah, dan renungkan langkahmu setiap malam.
          </p>
          <div class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <RouterLink
              to="/register"
              class="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-700 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-brand-900/20 transition hover:bg-brand-800 sm:w-auto"
            >
              Mulai sekarang
              <UiIcon path="M5 12h14M13 6l6 6-6 6" class="size-4" :stroke-width="2" />
            </RouterLink>
            <a
              :href="REPO_URL"
              target="_blank"
              rel="noopener"
              class="inline-flex w-full items-center justify-center gap-2 rounded-full border border-stone-300 bg-white px-6 py-3 text-sm font-semibold text-stone-800 transition hover:border-stone-400 sm:w-auto dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
            >
              <svg class="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path
                  d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.09 0 4.42-2.7 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5z"
                />
              </svg>
              Lihat di GitHub
            </a>
          </div>
        </div>

        <div class="relative mx-auto mt-14 max-w-5xl">
          <div
            class="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl shadow-stone-900/10 dark:border-stone-800 dark:bg-stone-900 dark:shadow-black/40"
          >
            <div
              class="flex items-center gap-1.5 border-b border-stone-200 px-4 py-2.5 dark:border-stone-800"
              aria-hidden="true"
            >
              <span class="size-2.5 rounded-full bg-stone-300 dark:bg-stone-700" />
              <span class="size-2.5 rounded-full bg-stone-300 dark:bg-stone-700" />
              <span class="size-2.5 rounded-full bg-stone-300 dark:bg-stone-700" />
            </div>
            <img
              src="/landing/beranda.png"
              alt="Beranda Muhasabah Daily: hitung mundur waktu sholat, fokus hari ini, habit, dan dzikir"
              class="w-full dark:hidden"
              width="1280"
              height="860"
            />
            <img
              src="/landing/beranda-gelap.png"
              alt="Beranda Muhasabah Daily dalam mode gelap"
              class="hidden w-full dark:block"
              width="1280"
              height="860"
            />
          </div>
          <div
            class="absolute -right-6 -bottom-10 hidden w-48 overflow-hidden rounded-[2rem] border-[6px] border-stone-900 shadow-2xl lg:block dark:border-stone-700"
          >
            <img
              src="/landing/beranda-mobile.png"
              alt="Tampilan beranda di ponsel dengan tab bar bawah"
              class="w-full"
              width="390"
              height="844"
            />
          </div>
        </div>
      </section>

      <!-- Fitur -->
      <section id="fitur" class="scroll-mt-20 py-16 sm:py-24">
        <div class="mx-auto max-w-6xl px-4 sm:px-6">
          <div class="mx-auto max-w-2xl text-center">
            <p class="text-sm font-semibold text-brand-800 dark:text-brand-300">
              Semua dalam satu tempat
            </p>
            <h2 class="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Alat yang kamu butuhkan untuk hari yang seimbang
            </h2>
          </div>
          <ul class="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <li
              v-for="f in FEATURES"
              :key="f.title"
              class="rounded-3xl border border-stone-200/80 bg-white p-6 shadow-soft dark:border-stone-800 dark:bg-stone-900 dark:shadow-none"
            >
              <span
                class="flex size-11 items-center justify-center rounded-2xl bg-brand-100 text-brand-800 dark:bg-brand-900 dark:text-brand-200"
              >
                <UiIcon :path="f.icon" class="size-5" />
              </span>
              <h3 class="mt-4 font-display text-lg font-semibold">{{ f.title }}</h3>
              <p class="mt-1.5 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
                {{ f.text }}
              </p>
            </li>
          </ul>
        </div>
      </section>

      <!-- Sorotan -->
      <section
        class="border-y border-stone-200/70 bg-white/60 py-16 sm:py-24 dark:border-stone-800/70 dark:bg-stone-900/40"
      >
        <div class="mx-auto max-w-6xl space-y-20 px-4 sm:px-6">
          <div
            v-for="(h, i) in HIGHLIGHTS"
            :key="h.title"
            class="grid grid-cols-1 items-center gap-10 lg:grid-cols-2"
          >
            <div :class="i % 2 === 1 && 'lg:order-2'">
              <p class="text-sm font-semibold text-brand-800 dark:text-brand-300">
                {{ h.eyebrow }}
              </p>
              <h2 class="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                {{ h.title }}
              </h2>
              <p class="mt-4 text-stone-600 dark:text-stone-300">{{ h.text }}</p>
            </div>
            <img
              :src="h.img"
              :alt="h.alt"
              loading="lazy"
              width="1280"
              :height="h.height"
              class="w-full rounded-2xl border border-stone-200 shadow-xl shadow-stone-900/10 dark:border-stone-800 dark:shadow-black/40"
            />
          </div>
        </div>
      </section>

      <!-- Privasi -->
      <section id="privasi" class="scroll-mt-20 py-16 sm:py-24">
        <div class="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-4 sm:px-6 md:grid-cols-3">
          <div class="md:col-span-3 md:mb-6">
            <p class="text-sm font-semibold text-brand-800 dark:text-brand-300">Privasi</p>
            <h2
              class="mt-2 max-w-2xl font-display text-3xl font-semibold tracking-tight sm:text-4xl"
            >
              Catatan pribadimu tetap milikmu
            </h2>
          </div>
          <div
            v-for="p in PRIVACY"
            :key="p.title"
            class="rounded-3xl border border-stone-200/80 bg-white p-6 shadow-soft dark:border-stone-800 dark:bg-stone-900 dark:shadow-none"
          >
            <span
              class="flex size-11 items-center justify-center rounded-2xl bg-gold-100 text-gold-700 dark:bg-gold-700/30 dark:text-gold-200"
            >
              <UiIcon :path="p.icon" class="size-5" />
            </span>
            <h3 class="mt-4 font-display text-lg font-semibold">{{ p.title }}</h3>
            <p class="mt-1.5 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
              {{ p.text }}
            </p>
          </div>
        </div>
      </section>

      <!-- Pasang sendiri -->
      <section id="mulai" class="scroll-mt-20 px-4 pb-20 sm:px-6">
        <div
          class="relative isolate mx-auto max-w-5xl overflow-hidden rounded-[2rem] bg-brand-900 px-6 py-12 text-brand-50 sm:px-12 dark:bg-brand-950"
        >
          <div
            class="absolute -top-24 -right-20 -z-10 size-80 rounded-full bg-brand-600/40 blur-3xl"
            aria-hidden="true"
          />
          <div
            class="absolute -bottom-24 -left-16 -z-10 size-72 rounded-full bg-gold-500/25 blur-3xl"
            aria-hidden="true"
          />
          <div class="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
            <div>
              <h2 class="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Pasang dalam tiga perintah
              </h2>
              <p class="mt-4 text-brand-100">
                Cukup Docker. Basis data, migrasi, dan data Al-Qur'an disiapkan otomatis, lalu buka
                <span class="font-mono text-white">http://localhost:8080</span> dan buat akunmu.
              </p>
              <div class="mt-8 flex flex-wrap gap-3">
                <RouterLink
                  to="/register"
                  class="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-brand-900 hover:bg-brand-50"
                >
                  Buat akun
                </RouterLink>
                <a
                  :href="`${REPO_URL}/blob/main/docs/self-hosting.md`"
                  target="_blank"
                  rel="noopener"
                  class="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/30 hover:bg-white/10"
                >
                  Panduan lengkap
                </a>
              </div>
            </div>
            <div class="min-w-0 rounded-2xl bg-stone-950/70 p-5 ring-1 ring-white/10">
              <div class="mb-3 flex items-center justify-between">
                <span class="text-xs font-medium text-stone-300">Terminal</span>
                <button
                  type="button"
                  class="rounded-full px-3 py-1 text-xs font-medium text-stone-200 ring-1 ring-white/20 hover:bg-white/10"
                  @click="copySteps"
                >
                  {{ copied ? 'Tersalin' : 'Salin' }}
                </button>
              </div>
              <pre
                tabindex="0"
                aria-label="Perintah instalasi"
                class="overflow-x-auto rounded-lg focus-visible:outline-2 focus-visible:outline-gold-300 text-sm leading-7 text-stone-100"
              ><code><span
                v-for="s in STEPS"
                :key="s"
                class="block"
              ><span class="text-gold-300 select-none" aria-hidden="true">$ </span>{{ s }}</span></code></pre>
            </div>
          </div>
        </div>
      </section>
    </main>

    <footer class="border-t border-stone-200/70 dark:border-stone-800/70">
      <div
        class="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-stone-600 sm:px-6 md:flex-row md:items-center md:justify-between dark:text-stone-400"
      >
        <div class="flex items-center gap-2.5">
          <img src="/favicon.svg" alt="" class="size-6" />
          <span>Muhasabah Daily · Lisensi MIT</span>
        </div>
        <p>
          Waktu sholat dari AlAdhan (metode Kemenag RI) · teks Al-Qur'an dari AlQuran Cloud ·
          <a
            :href="REPO_URL"
            target="_blank"
            rel="noopener"
            class="underline hover:text-stone-900 dark:hover:text-white"
          >
            GitHub
          </a>
        </p>
      </div>
    </footer>
  </div>
</template>
