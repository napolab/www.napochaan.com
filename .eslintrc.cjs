module.exports = {
  extends: [
    "@naporin0624/eslint-config",
    "@naporin0624/eslint-config/react",
    "plugin:jsx-a11y/strict",
    "plugin:@next/next/recommended",
  ],
  rules: {
    "no-void": "off",
    "react/jsx-uses-react": "off",
    "react/react-in-jsx-scope": "off",
    "no-restricted-imports": ["error", { patterns: ["../"] }], // 相対 path で親をたどるのを禁止する
    "import/no-extraneous-dependencies": [
      "error",
      {
        devDependencies: [
          "**/*.dev.ts",
          "**/*.test.ts",
          "**/*.test.tsx",
          "./*.config.js",
          "./*.config.ts",
          "**/*.stories.tsx",
          "**/*.story.tsx",
          "vitest-*",
        ],
      },
    ],
  },
  overrides: [
    {
      files: ["**/__tests__/**/*.[t]s?(x)", "**/?(*.)+(spec|test).[t]s?(x)"],
      extends: ["plugin:testing-library/react"],
      rules: {
        "react/jsx-no-bind": "off",
        "no-restricted-imports": "off"
      }
    },
    {
      files: ["**/*.stories.tsx", "**/*.story.tsx"],
      extends: ["plugin:storybook/recommended"],
      rules: {
        "react/jsx-no-bind": "off",
        "no-restricted-imports": "off"
      }
    },
  ],
};
