export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  extensionsToTreatAsEsm: ['.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.spec.ts'],
  globalSetup: './globalSetup.ts',
  globalTeardown: './globalTeardown.ts',
  setupFilesAfterEnv: ['./setupFile.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.test.json', useESM: true }],
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};
