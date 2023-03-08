import { useCallback, useState } from "react";

import { useIsomorphicLayoutEffect } from "@hooks/isomorphic-effect";

import { getSystemTheme } from "./utils";

import type { Theme } from "./provider";

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
