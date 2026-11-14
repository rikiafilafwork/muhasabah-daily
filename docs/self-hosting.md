# Menjalankan Sendiri (Self-hosting)

Panduan menjalankan Muhasabah Daily di komputer atau server rumah dengan Docker. Untuk pengembangan, lihat [README](../README.md#pengembangan).

## Kebutuhan

- Docker dengan Compose v2.24 atau lebih baru (`docker compose version`).
- Sekitar 1 GB ruang disk dan 1 GB RAM.
- Internet saat pertama kali start (mengunduh data Al-Qur'an, sekali saja) dan untuk waktu sholat serta audio murottal.

## Mulai

```bash
git clone <url-repositori> muhasabah-daily
cd muhasabah-daily
docker compose up -d
```

Buka **http://localhost:8080** lalu daftar akun. Saat start pertama, container `api`:

1. membuat secret JWT dan menyimpannya di volume `api-secrets` (bila tidak diisi di `.env`),
2. menjalankan migrasi basis data,
3. mengisi template habit dan konten dzikir,
4. mengimpor data Al-Qur'an (sekitar 15 detik; dilewati bila sudah ada).

Pantau prosesnya dengan `docker compose logs -f api`. Status semua layanan: `docker compose ps`.

## Konfigurasi

`.env` bersifat opsional. Salin dari contoh bila ingin mengubah pengaturan:

```bash
cp .env.example .env
```

| Variabel                                  | Bawaan                  | Keterangan                                                      |
| ----------------------------------------- | ----------------------- | --------------------------------------------------------------- |
| `WEB_PORT`                                | `8080`                  | Port di mesin host untuk membuka aplikasi                       |
| `PUBLIC_URL`                              | `http://localhost:8080` | Alamat yang dipakai pengguna; dipakai untuk CORS                |
| `POSTGRES_PASSWORD`                       | `muhasabah`             | Ganti sebelum start pertama bila server bisa diakses orang lain |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | dibuat otomatis         | Isi sendiri bila ingin mengelola secret di luar volume          |
| `AI_PROVIDER`, `AI_API_KEY`               | kosong                  | `anthropic` dan kunci Anthropic API untuk AI Polish jurnal      |
| `SEED_QURAN`                              | `true`                  | `false` untuk tidak mengimpor data Al-Qur'an saat start         |
| `COOKIE_SECURE`                           | `auto`                  | `auto` mengikuti protokol (HTTPS → cookie Secure)               |

Daftar lengkap ada di [ARCHITECTURE.md bagian 9](../ARCHITECTURE.md#9-konfigurasi). Setelah mengubah `.env`, jalankan `docker compose up -d` lagi.

Port sudah dipakai aplikasi lain? Jalankan misalnya `WEB_PORT=8090 docker compose up -d` (atau isi `WEB_PORT` di `.env`).

## Mengakses dari perangkat lain

Di jaringan rumah, buka `http://<IP-komputer>:8080` dari ponsel. Cookie sesi menyesuaikan protokol, jadi login berfungsi lewat HTTP biasa.

Untuk akses dari internet, **wajib** memakai HTTPS lewat reverse proxy. Contoh dengan [Caddy](https://caddyserver.com):

```
muhasabah.contoh.id {
  reverse_proxy localhost:8080
}
```

Lalu isi `PUBLIC_URL=https://muhasabah.contoh.id` di `.env`. Caddy meneruskan header `X-Forwarded-Proto`, sehingga cookie sesi otomatis bertanda `Secure`. Aplikasi bisa dipasang sebagai PWA dari browser ponsel bila dibuka lewat HTTPS.

## Pencadangan dan pemulihan

Data pengguna ada di volume `db-data` (PostgreSQL). Cadangkan secara berkala:

```bash
docker compose exec -T db pg_dump -U muhasabah -Fc muhasabah > muhasabah-$(date +%F).dump
```

Pulihkan ke instalasi baru (setelah `docker compose up -d`):

```bash
docker compose exec -T db pg_restore -U muhasabah -d muhasabah --clean --if-exists < muhasabah-2026-11-14.dump
docker compose restart api
```

Simpan juga secret JWT (volume `api-secrets` atau isi `.env`) bila ingin sesi login tetap berlaku setelah pemulihan; tanpa itu pengguna cukup masuk ulang.

## Memperbarui

```bash
git pull
docker compose up -d --build
```

Migrasi basis data dijalankan otomatis saat container `api` start. Baca [CHANGELOG.md](../CHANGELOG.md) sebelum memperbarui.

## Menghentikan dan menghapus

```bash
docker compose down        # hentikan, data tetap tersimpan
docker compose down -v     # hentikan dan HAPUS semua data (volume)
```

## Masalah umum

| Gejala                                     | Penyebab dan solusi                                                                          |
| ------------------------------------------ | -------------------------------------------------------------------------------------------- |
| `port is already allocated`                | Port 8080 dipakai aplikasi lain. Pakai `WEB_PORT=8090`.                                      |
| Hafidz/Kajian meminta impor data Al-Qur'an | Impor gagal karena tidak ada internet saat start. Jalankan `docker compose restart api`.     |
| Waktu sholat "sedang tidak tersedia"       | AlAdhan tidak bisa dihubungi. Fitur lain tetap jalan; jadwal muncul lagi saat koneksi pulih. |
| Tombol "Poles dengan AI" tidak muncul      | `AI_PROVIDER` atau `AI_API_KEY` belum diisi, atau API belum di-restart.                      |
| Login lewat domain HTTPS gagal             | Pastikan reverse proxy meneruskan `X-Forwarded-Proto` dan `PUBLIC_URL` sesuai domain.        |
