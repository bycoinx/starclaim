/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  testMatch: ['**/src/**/__tests__/**/*.test.js'],
  moduleNameMapper: {
    '^three$': '<rootDir>/__mocks__/three.js',
  },
  setupFiles: ['<rootDir>/jest.setup.js'],
  testTimeout: 15000,
};
