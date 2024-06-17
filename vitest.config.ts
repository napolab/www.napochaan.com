import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    react(),
    vanillaExtractPlugin(),
    tsconfigPaths()
  ],
  css: {
    postcss: {
      plugins: [],
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    includeSource: ["src/**/*.{js,ts}"],
    setupFiles: "./vitest-setup.ts",
    server: {
      deps: {
        inline: ["vitest-canvas-mock"],
      },
    },
  },
});
