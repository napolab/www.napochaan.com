module.exports = {
  extends: ["@naporin0624/eslint-config", "@naporin0624/eslint-config/react", "plugin:@next/next/recommended"],
  rules: {
    "no-void": "off",
    "react/jsx-uses-react": "off",
    "react/react-in-jsx-scope": "off",
    "no-restricted-imports": ["error", { patterns: ["../"] }], // 相対 path で親をたどるのを禁止する
    "import/no-extraneous-dependencies": ["error", { devDependencies: ["**/*.test.ts", "**/*.test.tsx"] }],
  },
};
