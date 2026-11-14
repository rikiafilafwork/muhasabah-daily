## Ringkasan

<!-- Apa yang berubah dan kenapa. Tautkan issue terkait, mis. "Menutup #12". -->

## Cara menguji

<!-- Langkah untuk memeriksa perubahan ini. -->

## Daftar periksa

- [ ] `pnpm lint && pnpm format:check && pnpm typecheck && pnpm test` hijau
- [ ] Test ditambahkan untuk logika baru (fungsi murni, kepemilikan data, alur auth bila disentuh)
- [ ] Endpoint baru hanya memakai `userId` dari token dan punya test akses lintas pengguna
- [ ] Perubahan skema disertai migrasi Prisma
- [ ] Teks antarmuka berbahasa Indonesia dan halaman baru lolos audit aksesibilitas (`e2e/a11y.spec.ts`)
- [ ] Konten keagamaan baru menyertakan rujukan dan dicatat di `DATA_SOURCES.md`
- [ ] Dokumentasi (`ARCHITECTURE.md`, `README.md`, `CHANGELOG.md`) diperbarui bila perlu
