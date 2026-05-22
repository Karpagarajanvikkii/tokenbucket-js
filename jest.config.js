module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.js'],
  collectCoverageFrom: ['src/**/*.js'],
  coverageThresholds: {
    global: { branches: 80, functions: 90, lines: 90, statements: 90 },
  },
};
