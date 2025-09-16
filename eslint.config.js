import { fixupConfigRules } from "@eslint/compat";
import { FlatCompat } from "@eslint/eslintrc";
import eslint from "@eslint/js";
import napoPlugin from "@napolab/eslint-plugin";
import nextPlugin from "@next/eslint-plugin-next";
import eslintConfigPrettier from "eslint-config-prettier";
import importPlugin from "eslint-plugin-import-x";
import a11yPlugin from "eslint-plugin-jsx-a11y";
import reactPlugin from "eslint-plugin-react";
import hooksPlugin from "eslint-plugin-react-hooks";
import unicornPlugin from "eslint-plugin-unicorn";
import unusedImports from "eslint-plugin-unused-imports";
import testingLibrary from "eslint-plugin-testing-library";
import jestDom from "eslint-plugin-jest-dom";
import globals from "globals";
import tseslint from "typescript-eslint";

const compat = new FlatCompat({
  baseDirectory: process.cwd(),
  recommendedConfig: eslint.configs.recommended,
});

// Use standard config as fallback
const standard = fixupConfigRules(compat.config({ extends: ["standard"] }));

/** @type {import("eslint").Linter.Config[]} */
const config = [
  eslint.configs.recommended,
  ...standard,
  {
    ignores: [
      "**/dist/**",
      "**/build/**",
      "**/node_modules/**",
      ".next/**",
      "**/out/**",
      "**/coverage/**",
      ".wrangler/**",
      ".github/**",
      ".vercel/**",
      ".open-next/**",
      ".lighthouseci/**",
      "wrangler-types-env.d.ts",
      "eslint.config.js",
      "scripts/**",
    ],
  },
  {
    files: ["**/*.{js,ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
    },
    rules: {
      "no-void": "off",
      "no-unreachable": "error",
      "lines-between-class-members": "off",
      "no-array-constructor": "off",
      "no-console": "error",
      "newline-before-return": "error",
      "no-unused-vars": "off",
      "dot-notation": "off",
      camelcase: [
        "error",
        {
          ignoreImports: true,
          properties: "never",
          allow: [],
        },
      ],
      "no-restricted-imports": [
        "error",
        {
          patterns: ["../"], // 相対 path で親をたどるのを禁止する
        },
      ],
    },
  },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      "@next/next/no-html-link-for-pages": "error",
      "@next/next/no-img-element": "off",
      "@next/next/no-unwanted-polyfillio": "error",
      "@next/next/google-font-preconnect": "error",
    },
    settings: {
      next: {
        rootDir: ".",
      },
    },
  },
  {
    files: ["**/*.{js,ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parser: tseslint.parser,
      parserOptions: {
        project: true,
      },
      globals: {
        ...globals.es2022,
        ...globals.browser,
        React: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      "import-x": importPlugin,
      "unused-imports": unusedImports,
      unicorn: unicornPlugin,
      napo: napoPlugin,
    },
    rules: {
      ...importPlugin.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-use-before-define": "off",
      "@typescript-eslint/interface-name-prefix": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-var-requires": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-array-constructor": "error",
      "@typescript-eslint/no-unnecessary-boolean-literal-compare": "error",
      "@typescript-eslint/consistent-generic-constructors": ["error", "constructor"],
      "@typescript-eslint/array-type": ["error", { default: "array" }],
      "@typescript-eslint/strict-boolean-expressions": "warn",
      "@typescript-eslint/no-unnecessary-condition": "warn",
      "@typescript-eslint/consistent-type-exports": [
        "error",
        {
          fixMixedExportsWithInlineTypeSpecifier: false,
        },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
        },
      ],
      "import-x/default": "off",
      "import-x/no-named-as-default-member": "off",
      "import-x/no-extraneous-dependencies": [
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
      "import-x/order": [
        "error",
        {
          groups: ["builtin", "external", "internal", "parent", "sibling", "index", "object", "type"],
          "newlines-between": "always",
          pathGroupsExcludedImportTypes: ["builtin"],
          alphabetize: { order: "asc", caseInsensitive: true },
          pathGroups: [{ pattern: "./types/**", group: "internal", position: "before" }],
        },
      ],
      "unused-imports/no-unused-imports": "warn",
      "unicorn/prefer-node-protocol": "error",
      "unicorn/filename-case": ["error", { case: "kebabCase" }],
      "unicorn/better-regex": "error",
      "napo/prefer-array-at": "error",
    },
    settings: {
      "import-x/resolver": {
        typescript: true,
        node: true,
      },
      "import-x/parsers": {
        "@typescript-eslint/parser": [".js", ".jsx", ".ts", ".tsx"],
      },
    },
  },
  {
    files: ["**/*.jsx", "**/*.tsx"],
    ...reactPlugin.configs.flat.recommended,
  },
  {
    files: ["**/*.jsx", "**/*.tsx"],
    ...a11yPlugin.flatConfigs.strict,
  },
  {
    files: ["**/*.jsx", "**/*.tsx"],
    plugins: {
      react: reactPlugin,
      "react-hooks": hooksPlugin,
    },
    rules: {
      ...hooksPlugin.configs.recommended.rules,
      "react/prop-types": "off",
      "react/display-name": "off",
      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-react": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
      "react/jsx-no-bind": "error",
      "react/jsx-no-leaked-render": "error",
      "react/jsx-key": ["error", { checkFragmentShorthand: false }],
      "react/no-object-type-as-default-prop": "error",
      "react/jsx-equals-spacing": "error",
      "react/no-array-index-key": "error",
      "react/jsx-no-useless-fragment": "error",
      "react/function-component-definition": [
        2,
        {
          namedComponents: "arrow-function",
          unnamedComponents: "arrow-function",
        },
      ],
      "react/jsx-handler-names": [
        "error",
        {
          eventHandlerPrefix: "(handle|on|set)",
          eventHandlerPropPrefix: "on",
          checkLocalVariables: false,
          checkInlineFunction: false,
        },
      ],
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  {
    files: ["**/*.test.{ts,tsx}", "**/__tests__/**/*.[t]s?(x)", "**/?(*.)+(spec|test).[t]s?(x)"],
    plugins: {
      "testing-library": testingLibrary,
      "jest-dom": jestDom,
    },
    languageOptions: {
      globals: {
        ...globals.node,
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        describe: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        vi: "readonly",
      },
    },
    rules: {
      ...testingLibrary.configs.react.rules,
      ...jestDom.configs.recommended.rules,
      "react/jsx-no-bind": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "no-console": "off",
      "no-restricted-imports": "off",
      "napo/prefer-array-at": "off",
    },
  },
  {
    files: ["worker.ts"],
    plugins: {
      "import-x": importPlugin,
    },
    languageOptions: {
      globals: {
        ...globals.es2022,
        Env: "readonly",
        ExportedHandler: "readonly",
        ExecutionContext: "readonly",
      },
    },
    rules: {
      "import-x/no-unresolved": "off",
    },
    settings: {
      "import-x/resolver": {
        typescript: true,
        node: true,
      },
      "import-x/parsers": {
        "@typescript-eslint/parser": [".js", ".jsx", ".ts", ".tsx"],
      },
    },
  },
  {
    files: ["**/_components/**"],
    rules: {
      "no-restricted-imports": "off",
    },
  },
  eslintConfigPrettier,
];

export default config;
