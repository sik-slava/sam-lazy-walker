module.exports = {
  env: {
    commonjs: true,
    es2021: true,
    node: true
  },
  extends: [
    'standard',
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest'
  },
  rules: {
    semi: ['error', 'always', { omitLastInOneLineBlock: true }],
    curly: ['error', 'multi'],
    'comma-dangle': ['error', 'only-multiline'],
    'max-len': ['error', { code: 100 }]
  }
};
