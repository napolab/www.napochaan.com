import { useWatchSystemTheme } from "./hook";
import { ThemeProvider } from "./provider";

import type { ThemeProviderProps } from "./provider";

export type { ThemeProviderProps };
export { ThemeProvider, useWatchSystemTheme };

export type Theme = "dark" | "light";
export const isTheme = (value: unknown): value is Theme => {
  return typeof value === "string" && ["dark", "light"].includes(value);
};

export const getSystemTheme = (fallback: Theme): Theme => {
  if (typeof window === "undefined") return fallback;

  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};
