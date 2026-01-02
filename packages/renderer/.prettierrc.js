// prettier.config.js, .prettierrc.js, prettier.config.cjs, or .prettierrc.cjs

/** @type {import("prettier").Config} */
const config = {
  tabWidth: 2,
  useTabs: false,
  singleQuote: true,
  semi: true,
  bracketSpacing: true,
  arrowParens: 'avoid',
  trailingComma: 'all', // default
  bracketSameLine: false, // default
  printWidth: 80, // default
  overrides: [
    {
      files: '*.{ui,page}.html',
      options: {
        parser: 'angular',
      },
    },
  ],
  htmlWhitespaceSensitivity: 'ignore',
};

module.exports = config;
