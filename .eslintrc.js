module.exports = {
  root: true,
  ignorePatterns: ['packages/client/**/*'],
  parserOptions: {
    project: true,
    tsconfigRootDir: __dirname,
    ecmaVersion: 'latest',
  },
  env: {
    es6: true,
  },
  overrides: [
    {
      files: ['*.ts'],
      parserOptions: {
        project: ['tsconfig.json'],
        createDefaultProgram: true
      },
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:prettier/recommended'
      ],
      rules: {
        'eqeqeq': ["error", "always"],
        '@typescript-eslint/no-explicit-any': "off",
        '@typescript-eslint/ban-types': "off",
        'no-extra-boolean-cast': 'off',
        'no-fallthrough': 'off',
        'no-async-promise-executor': 'off',
        'no-case-declarations': 'off',
        '@typescript-eslint/no-unused-vars': [
          'error', {
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_',
            caughtErrorsIgnorePattern: '^_'
          }],
      }
    }
  ]
}
