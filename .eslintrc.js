module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'indent': ['error', 2],
    'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'no-unused-vars': ['warn'],
    'no-console': ['warn'],
  },
  ignorePatterns: [
    'node_modules/',
    'logs/',
    '*.min.js',
    'src/public/',
  ],
  overrides: [
    {
      files: ['src/config/**/*.js', 'src/controllers/**/*.js', 'src/middleware/**/*.js', 'src/services/**/*.js'],
      parserOptions: {
        sourceType: 'script',
      },
    },
  ],
}; 
