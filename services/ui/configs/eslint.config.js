module.exports = {
  env: {
    "node": true
  },
  plugins: ['import'],
  extends: [
    "plugin:vue/vue3-essential",
    "eslint:recommended",
    'plugin:prettier/recommended',
  ],
  parserOptions: {
    requireConfigFile: false,
    parser: "@babel/eslint-parser",
  },
}