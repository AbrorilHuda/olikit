const expoConfig = require('eslint-config-expo/flat');

module.exports = [
  {
    ignores: ['dist/**', '.expo/**', 'tests/**', 'node_modules/**'],
  },
  ...expoConfig,
];

