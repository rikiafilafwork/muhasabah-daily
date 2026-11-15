#!/bin/sh
# Entrypoint container API: siapkan secret, migrasi, seed dasar, lalu jalankan server.
set -eu

# 1) Secret JWT. Bila tidak disediakan lewat .env, buat sekali dan simpan di volume
#    agar sesi pengguna tetap berlaku setelah container dibuat ulang.
SECRETS_DIR="${SECRETS_DIR:-/app/secrets}"
mkdir -p "$SECRETS_DIR"
for name in JWT_ACCESS_SECRET JWT_REFRESH_SECRET; do
  eval "current=\${$name:-}"
  if [ -z "$current" ]; then
    file="$SECRETS_DIR/$name"
    if [ ! -s "$file" ]; then
      umask 077
      node -e "process.stdout.write(require('node:crypto').randomBytes(48).toString('hex'))" > "$file"
      echo "Secret $name dibuat dan disimpan di volume."
    fi
    export "$name=$(cat "$file")"
  fi
done

# 1b) Kunci VAPID untuk Web Push (pengingat). Dibuat sekali bila kosong, disimpan di volume;
#     mengganti kunci membuat semua perangkat harus mengaktifkan notifikasi ulang.
if [ -z "${VAPID_PUBLIC_KEY:-}" ] || [ -z "${VAPID_PRIVATE_KEY:-}" ]; then
  vapid="$SECRETS_DIR/vapid.json"
  if [ ! -s "$vapid" ]; then
    umask 077
    node -e "process.stdout.write(JSON.stringify(require('web-push').generateVAPIDKeys()))" > "$vapid"
    echo "Kunci VAPID dibuat dan disimpan di volume."
  fi
  VAPID_PUBLIC_KEY="$(node -p "require('$vapid').publicKey")"
  VAPID_PRIVATE_KEY="$(node -p "require('$vapid').privateKey")"
  export VAPID_PUBLIC_KEY VAPID_PRIVATE_KEY
fi

# 2) Migrasi basis data.
./node_modules/.bin/prisma migrate deploy

# 3) Seed dasar (template habit, dzikir). Idempoten; tanpa internet memakai teks bawaan.
node dist-seed/prisma/seed/index.js || echo "Peringatan: seed dasar gagal, lanjut menjalankan API."

# 4) Data Al-Qur'an, sekali saja. Matikan dengan SEED_QURAN=false. Kegagalan tidak menghentikan API.
if [ "${SEED_QURAN:-true}" != "false" ]; then
  node dist-seed/prisma/seed/quran-cli.js --direct --if-empty \
    || echo "Peringatan: impor Al-Qur'an gagal (butuh internet). Coba lagi dengan me-restart container api."
fi

exec node dist/main.js
