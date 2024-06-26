import { createGlobalTheme, createGlobalThemeContract, createVar, globalStyle } from "@vanilla-extract/css";

import { mediaQueries } from "@theme/utils";

import type { MapLeafNodes } from "@theme/utils";

const palettes = {
  background: {
    main: null,
    secondary: null,
    tertiary: null,
  },
  text: {
    main: null,
    secondary: null,
  },
  link: {
    main: null,
    hover: null,
  },
  border: {
    main: null,
    focus: null,
  },
  warning: null,
  accent1: null,
  accent2: null,
  accent3: null,
  disabled: null,
  white: null,
  black: null,
  overlay: null,
  shadow: null,
  scrollbar: {
    background: {
      main: null,
      hover: null,
    },
    thumb: null,
  },
};

export type Palettes = MapLeafNodes<typeof palettes, string>;
export const vars = createGlobalThemeContract(
  {
    palettes: {
      ...palettes,
      rgb: palettes as Omit<typeof palettes, "overlay" | "shadow">,
    },
    borderRadius: {
      xs: null,
      sm: null,
      md: null,
      lg: null,
      xl: null,
    },
    typography: {
      body: null,
    },
    space: {
      xs: null,
      sm: null,
      md: null,
      lg: null,
      xl: null,
    },
    font: {
      body: null,
      notoSansJP: "noto-sans-jp",
      poppins: "poppins",
    },
  },
  (value, path) => value ?? path.join("-"),
);

createGlobalTheme(":root", vars.space, {
  xs: "calc(1rem / 4)",
  sm: "calc(1rem / 2)",
  md: "1rem",
  lg: "calc(1rem * 2)",
  xl: "calc(1rem * 4)",
});

createGlobalTheme(":root", vars.font, {
  notoSansJP: "'Noto Sans JP'",
  poppins: "'Poppins'",
  body: `${vars.font.poppins}, ${vars.font.notoSansJP}, sans-serif`,
});

createGlobalTheme(":root", vars.borderRadius, {
  xs: "calc(1rem / 4)",
  sm: "calc(1rem / 2)",
  md: "1rem",
  lg: "calc(1rem * 2)",
  xl: "calc(1rem * 4)",
});

const body = createVar();

globalStyle(":root", {
  vars: {
    [body]: "18px",
  },
  "@media": {
    [mediaQueries.sm]: {
      vars: {
        [body]: "16px",
      },
    },
  },
});

createGlobalTheme(`:root`, vars.typography, {
  body,
});
