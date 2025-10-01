module.exports = {
  testEnvironment: 'node',
  transform: {},
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.js'
  ],
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  collectCoverageFrom: [
    'controllers/**/*.js',
    'middleware/**/*.js',
    'utils/**/*.js'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};