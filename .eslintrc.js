module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
    node: true,
  },
  extends: ['eslint:recommended', 'prettier'],
  plugins: ['prettier'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'prettier/prettier': 'error',
    'no-unused-vars': ['warn'],
    'no-console': ['warn'],
    'no-debugger': 'warn',
    'no-duplicate-imports': 'error',
    'no-unused-expressions': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    'no-process-exit': 'warn',
    'handle-callback-err': 'error',
  },
  ignorePatterns: ['node_modules/', 'logs/', '*.min.js', 'src/public/', 'healthcheck.js'],
  overrides: [
    {
      files: [
        'src/config/**/*.js',
        'src/controllers/**/*.js',
        'src/middleware/**/*.js',
        'src/services/**/*.js',
      ],
      parserOptions: {
        sourceType: 'script',
      },
    },
    {
      files: ['src/public/js/**/*.js'],
      env: {
        browser: true,
        es2021: true,
      },
      parserOptions: {
        sourceType: 'module',
      },
    },
  ],
};
