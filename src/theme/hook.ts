import { useCallback, useEffect, useState } from "react";

import { getSystemTheme } from "./utils";

import type { Theme } from "./provider";

export const useWatchSystemTheme = (): Theme => {
  const [theme, setTheme] = useState<Theme>(getSystemTheme);
  const onChange = useCallback(() => {
    setTheme(getSystemTheme);
  }, []);
  useEffect(() => {
    const mediaQueryList = matchMedia("(prefers-color-scheme: dark)");
    mediaQueryList.addEventListener("change", onChange);

    return () => {
      mediaQueryList.removeEventListener("change", onChange);
    };
  }, [onChange]);

  return theme;
};
