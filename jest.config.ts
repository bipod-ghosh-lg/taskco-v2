import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // jose and @neondatabase/serverless ship as ESM — transform them through next/jest's babel
  transformIgnorePatterns: [
    '/node_modules/(?!(jose|@neondatabase/serverless)/)',
  ],
};

export default createJestConfig(config);
