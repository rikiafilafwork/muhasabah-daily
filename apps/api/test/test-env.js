// Variabel lingkungan test integrasi. Basis data dan Redis DB terpisah dari pengembangan.
const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env'), quiet: true });

const env = {
  NODE_ENV: 'test',
  DATABASE_URL:
    process.env.TEST_DATABASE_URL ??
    'postgresql://muhasabah:muhasabah@localhost:5432/muhasabah_test',
  REDIS_URL: process.env.TEST_REDIS_URL ?? 'redis://localhost:6379/1',
  JWT_ACCESS_SECRET: 'test-access-secret-0123456789-abcdefghijklmnop',
  JWT_REFRESH_SECRET: 'test-refresh-secret-0123456789-abcdefghijklmno',
  CORS_ORIGIN: 'http://localhost:5173',
  // Kunci VAPID khusus test (bukan rahasia); pengiriman push diganti tiruan.
  VAPID_PUBLIC_KEY:
    'BFMYgufURTL_wLc69hsikpNWB9HFvMBkld83rZlcTZ6fZZtKixs6ZZwROg-DNPJhrLmXzUxumYQdmau7VH9seb8',
  VAPID_PRIVATE_KEY: 'POK1dthTMkXfP4JOCeSuytuOY0pejHxwmJyE9XGLoCA', // gitleaks:allow
  REMINDERS_SCHEDULER: 'off',
};

module.exports = { env };
