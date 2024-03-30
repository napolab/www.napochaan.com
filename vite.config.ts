/// <reference types="vitest" />
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [...(process.env.NODE_ENV === "test" ? [react()] : []), vanillaExtractPlugin(), tsconfigPaths()],
  css: {
    postcss: {
      plugins: [],
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    deps: {
      inline: ["vitest-canvas-mock"],
    },
    includeSource: ["src/**/*.{js,ts}"],
    setupFiles: "./vitest-setup.ts",
  },
});
