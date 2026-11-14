# Kebijakan Keamanan

## Melaporkan kerentanan

Jangan laporkan kerentanan lewat issue publik. Gunakan fitur **Report a vulnerability** (laporan privat) di tab _Security_ repositori ini. Sertakan:

- jenis masalah dan dampaknya,
- langkah untuk mengulang (versi atau commit, konfigurasi yang relevan),
- usulan perbaikan bila ada.

Kami akan menanggapi secepatnya dan mengabarkan perkembangan perbaikannya. Mohon beri waktu perbaikan dirilis sebelum mengungkapkan detailnya.

## Cakupan

Muhasabah Daily dijalankan sendiri oleh penggunanya. Perhatikan:

- Simpan `.env` dan volume `api-secrets` dengan aman; keduanya berisi secret JWT dan kunci API AI.
- Bila dibuka dari luar jaringan lokal, letakkan di belakang reverse proxy dengan HTTPS (lihat `docs/self-hosting.md`).
- Isi jurnal hanya dikirim ke penyedia AI saat pengguna menekan **Poles dengan AI**, dan tidak pernah ditulis ke log.

Rancangan keamanan dijelaskan di `ARCHITECTURE.md` bagian 4.3 dan 13.
