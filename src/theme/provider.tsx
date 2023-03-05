import { Fragment, useEffect } from "react";

import type { FC, PropsWithChildren } from "react";

import "./global.css";
import "./config/dark.css";
import "./config/light.css";

/**
 * @package
 */
export type Theme = "dark" | "light";

/**
 * @package
 */
export type ThemeProviderProps = {
  theme?: Theme;
};

/**
 * @package
 */
export const ThemeProvider: FC<PropsWithChildren<ThemeProviderProps>> = ({ theme, children }) => {
  useEffect(() => {
    const el = document.querySelector("html");
    if (!el || !theme) return;

    el.classList.add(theme);

    return () => {
      el.classList.remove(theme);
    };
  }, [theme]);

  return <Fragment>{children}</Fragment>;
};
