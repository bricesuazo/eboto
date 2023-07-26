module.exports = {
  root: true,
  // This tells ESLint to load the config from the package `eslint-config-custom`
  extends: ["@eboto-mo/eslint-config/base"],
  settings: {
    next: {
      rootDir: ["apps/*/"],
    },
  },
};
