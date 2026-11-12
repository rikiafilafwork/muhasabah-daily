/** @type {import('jest').Config} */
const base = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  transform: { '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json' }] },
  testEnvironment: 'node',
};

module.exports = {
  // Test integrasi berbagi satu basis data, jadi dijalankan berurutan.
  maxWorkers: 1,
  projects: [
    { ...base, displayName: 'unit', rootDir: 'src', testRegex: '.*\\.spec\\.ts$' },
    {
      ...base,
      displayName: 'integration',
      rootDir: 'test',
      testRegex: '.*\\.e2e-spec\\.ts$',
      globalSetup: '<rootDir>/global-setup.js',
      setupFiles: ['<rootDir>/setup-env.js'],
    },
  ],
};
