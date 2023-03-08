import { Fragment } from "react";

import { useIsomorphicLayoutEffect } from "@hooks/isomorphic-effect";

import type { FC, PropsWithChildren } from "react";


import "./config/dark.css";
import "./config/light.css";
import "./global.css";

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
  useIsomorphicLayoutEffect(() => {
    const el = document.querySelector("html");
    if (!el || !theme) return;

    el.classList.add(theme);

    return () => {
      el.classList.remove(theme);
    };
  }, [theme]);

  return <Fragment>{children}</Fragment>;
};
