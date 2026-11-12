const { execSync } = require('node:child_process');
const path = require('node:path');
const { env } = require('./test-env');

module.exports = async () => {
  execSync('pnpm exec prisma migrate deploy', {
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, ...env },
    stdio: 'inherit',
  });
};
