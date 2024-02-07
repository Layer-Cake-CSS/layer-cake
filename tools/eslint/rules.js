module.exports = {
  "import/no-default-export": "error",
  "import/prefer-default-export": "off",
  "unicorn/no-null": "off",
  "no-restricted-syntax": ["error", "LabeledStatement", "WithStatement"],
  "unicorn/prevent-abbreviations": [
    "error",
    {
      allowList: {
        env: true,
      },
    },
  ],
};
