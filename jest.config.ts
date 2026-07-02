import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jest-environment-jsdom',
  roots: ['<rootDir>/src/test'],
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // Ignore CSS/image imports
    '\\.(css|svg|png|jpg)$': '<rootDir>/src/test/__mocks__/fileMock.ts',
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
      },
      diagnostics: { warnOnly: true },
    }],
  },
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  extensionsToTreatAsEsm: [],
};

export default config;
