import { useCallback, useState } from "react";

import { useIsomorphicLayoutEffect } from "@hooks/isomorphic-effect";

import { ThemeProvider } from "./provider";

import type { ThemeProviderProps } from "./provider";

export type { ThemeProviderProps };
export { ThemeProvider };

export type Theme = "dark" | "light";
export const isTheme = (value: unknown): value is Theme => {
  return typeof value === "string" && ["dark", "light"].includes(value);
};

export const getSystemTheme = (fallback: Theme): Theme => {
  if (typeof window === "undefined") return fallback;

  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export const useWatchSystemTheme = (): Theme => {
  const [theme, setTheme] = useState<Theme>("light");
  const onChange = useCallback(() => {
    setTheme(getSystemTheme);
  }, []);
  useIsomorphicLayoutEffect(() => {
    const mediaQueryList = matchMedia("(prefers-color-scheme: dark)");
    mediaQueryList.addEventListener("change", onChange);
    onChange();

    return () => {
      mediaQueryList.removeEventListener("change", onChange);
    };
  }, [onChange]);

  return theme;
};
