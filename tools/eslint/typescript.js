const base = require("./base");
const rules = require("./rules");

module.exports = {
  ...base,
  overrides: [
    {
      files: ["*.ts"],
      parser: "@typescript-eslint/parser",
      parserOptions: {
        project: "./tsconfig.json",
      },
      extends: [
        "plugin:unicorn/recommended",
        "airbnb/base",
        "airbnb-typescript/base",
        "turbo",
        "prettier",
      ],
      rules,
    },
    {
      files: ["tsup.config.ts"],
      parserOptions: {
        project: "./tsconfig.node.json",
      },
      rules: {
        ...rules,
        "import/no-default-export": "off",
        "import/no-extraneous-dependencies": [
          "error",
          { devDependencies: true },
        ],
      },
    },
  ],
};
