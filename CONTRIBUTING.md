# Panduan Kontribusi

Terima kasih ingin membantu! Baca [ARCHITECTURE.md](ARCHITECTURE.md) dulu untuk memahami struktur dan aturan modul.

## Menyiapkan lingkungan

Ikuti langkah di [README.md](README.md#menjalankan). Pastikan `pnpm test` hijau sebelum mulai.

## Alur kerja

1. Buat cabang dari `main`: `feat/habits-insight`, `fix/prayer-cache-ttl`, dst.
2. Tulis kode dan test-nya. Wajib ada test untuk:
   - fungsi perhitungan murni (insight, progres, tanggal),
   - kepemilikan data: pengguna A tidak bisa membaca atau mengubah data pengguna B,
   - perubahan alur autentikasi.
3. Jalankan `pnpm lint && pnpm format:check && pnpm typecheck && pnpm test`.
4. Buka pull request dengan deskripsi singkat: apa yang berubah, kenapa, dan cara mengujinya.

Pesan commit memakai gaya [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`).

## Aturan kode

- **Batas paket:** `web` dan `api` hanya boleh berbagi kode lewat `packages/shared`.
- **Batas fitur (web):** impor fitur lain hanya lewat `src/features/<fitur>/index.ts`.
- **API:** controller tipis, aturan bisnis di service. `userId` selalu dari token (`@CurrentUser()`), tidak pernah dari body atau query.
- **Validasi:** skema zod didefinisikan di `packages/shared` dan dipakai di form web serta DTO API (`createZodDto`).
- **Error:** lempar `AppException` dengan kode dari `ErrorCode`. Tambahkan kode baru di `packages/shared/src/errors.ts`.
- **Tanggal:** instan disimpan UTC; tanggal harian disimpan sebagai tanggal lokal pengguna (`toLocalDate`).
- **Privasi:** jangan mencatat isi jurnal atau data pribadi di log.
- **Konten keagamaan:** sertakan rujukan dan sumber, dan catat sumber data baru di [DATA_SOURCES.md](DATA_SOURCES.md).

## Migrasi basis data

```bash
pnpm --filter api db:migrate --name tambah_tabel_habit
```

Commit folder migrasi yang dihasilkan bersama perubahan `schema.prisma`.
