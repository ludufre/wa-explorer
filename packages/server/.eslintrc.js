module.exports = {
  root: true,
  ...require('../../.eslintrc.js'),
  parserOptions: {
    project: ['./tsconfig.json'],
    tsconfigRootDir: __dirname,
  }
}
