module.exports = {
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  setupFiles: ['<rootDir>/tests/setup-env.js'],
  globalSetup: '<rootDir>/tests/globalSetup.js',
  // The whole suite shares one sbims_test database and fixture rows, so
  // files must run one at a time rather than in parallel -- otherwise two
  // files mutating the same product's stock_kg at once would make tests
  // flaky for reasons that have nothing to do with the code being tested.
  maxWorkers: 1,
  testTimeout: 15000,
  forceExit: true,
};
