/// <reference types="vitest" />
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [vanillaExtractPlugin(), tsconfigPaths()],
  test: {
    globals: true,
    environment: "happy-dom",
    includeSource: ["src/**/*.{js,ts}"],
  },
});
