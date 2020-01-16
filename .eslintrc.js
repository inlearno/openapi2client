module.exports = {
  env: {
    browser: true,
    node: true,
    webextensions: true
  },
  extends: [
    'eslint:recommended',
    'plugin:node/recommended',
    'plugin:@typescript-eslint/recommended',
    "plugin:prettier/recommended",
    "prettier/typescript",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2018,
    ecmaFeatures: {
      experimentalObjectRestSpread: true,
      jsx: true,
      legacyDecorators: true,
    },
    sourceType: 'module',
  },
  plugins: ["@typescript-eslint"],
  rules: {
    'no-console': [0],
    '@typescript-eslint/member-delimiter-style': [0],
    '@typescript-eslint/camelcase': [0],
    '@typescript-eslint/explicit-function-return-type': [0],
    'prettier/prettier': 'error',
    'react/prop-types': [0],
    'react/display-name': [0],
    'no-const-assign': 'error',
    'no-this-before-super': 'error',
    'no-undef': 'error',
    'no-unreachable': 'error',
    'no-unused-vars': [
      'error',
      { varsIgnorePattern: '^_', args: 'all', argsIgnorePattern: '^_' },
    ],
    'constructor-super': 'error',
    'valid-typeof': 'error',
    'no-only-tests/no-only-tests': 'error',
    'node/no-unsupported-features/es-syntax': 0,
    'node/no-unsupported-features/node-builtins': 0,
    'node/shebang': [
      'error',
      {
        convertPath: {
          'src/**/*.js': ['src/(.+)$',  'dist/$1']
        },
      },
    ],
  },
  settings: {
    react: {
      version: "999.999.999"
    }
  }
}
