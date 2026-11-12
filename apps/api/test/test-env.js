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
};

module.exports = { env };
