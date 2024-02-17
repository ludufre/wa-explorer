module.exports = {
  root: true,
  ignorePatterns: ['projects/**/*'],
  parserOptions: {
    project: true,
    tsconfigRootDir: __dirname,
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
        'plugin:@angular-eslint/recommended',
        'plugin:@angular-eslint/template/process-inline-templates',
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
        '@angular-eslint/component-class-suffix': [
          'error',
          {
            suffixes: ['Page', 'Component']
          }
        ],
        '@angular-eslint/component-selector': [
          'error',
          {
            type: 'element',
            // prefix: 'app',
            style: 'kebab-case'
          }
        ],
        '@angular-eslint/directive-selector': [
          'error',
          {
            type: 'attribute',
            prefix: 'app',
            style: 'camelCase'
          }
        ]
      }
    },
    {
      files: ['*.html'],
      extends: ['plugin:@angular-eslint/template/recommended'],
      rules: {}
    }
  ]
}
