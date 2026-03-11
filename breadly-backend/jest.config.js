export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.spec.ts'],
  globalSetup: './globalSetup.ts',
  globalTeardown: './globalTeardown.ts',
  setupFilesAfterEnv: ['./setupFile.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { useESM: false, tsconfig: 'tsconfig.test.json' }],
  },
};
