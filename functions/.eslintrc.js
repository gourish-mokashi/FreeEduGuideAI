module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "google",
  ],
  rules: {
    "quotes": ["error", "double"],
    "max-len": ["error", {"code": 80}],
    "require-jsdoc": "off",
    "comma-dangle": ["error", "always-multiline"],
    "object-curly-spacing": ["error", "never"],
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
};
