import { createGlobalTheme, createGlobalThemeContract, createVar, globalStyle } from "@vanilla-extract/css";
import { calc } from "@vanilla-extract/css-utils";

import type { MapLeafNodes } from "@theme/utils";

const pallets = {
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
};

export type Pallets = MapLeafNodes<typeof pallets, string>;
export const vars = createGlobalThemeContract(
  {
    pallets: {
      ...pallets,
      rgb: pallets,
    },
    borderRadius: {
      sx: null,
      sm: null,
      md: null,
      lg: null,
      xl: null,
    },
    typography: {
      heading1: null,
      heading2: null,
      heading3: null,
      body: null,
    },
    space: {
      sx: null,
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
    easing: {
      easeInOutCirc: null,
    },
  },
  (value, path) => value ?? path.join("-"),
);

createGlobalTheme(":root", vars.easing, {
  easeInOutCirc: "cubic-bezier(0.79,0.14,0.15,0.86)",
});

createGlobalTheme(":root", vars.space, {
  sx: "calc(1rem / 4)",
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
  sx: "calc(1rem / 4)",
  sm: "calc(1rem / 2)",
  md: "1rem",
  lg: "calc(1rem * 2)",
  xl: "calc(1rem * 4)",
});

const body = createVar();
const heading1 = createVar();
const heading2 = createVar();
const heading3 = createVar();

globalStyle(":root", {
  vars: {
    [body]: "18px",
    [heading1]: calc.multiply(vars.typography.body, 3),
    [heading2]: calc.multiply(vars.typography.body, 2),
    [heading3]: calc.multiply(vars.typography.body, 1.5),
  },
  "@media": {
    "screen and (max-width: 639px)": {
      vars: {
        [body]: "16px",
        [heading1]: calc.multiply(vars.typography.body, 2),
        [heading2]: calc.multiply(vars.typography.body, 1.5),
        [heading3]: vars.typography.body,
      },
    },
  },
});

createGlobalTheme(`:root`, vars.typography, {
  body,
  heading1,
  heading2,
  heading3,
});
