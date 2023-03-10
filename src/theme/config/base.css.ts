import { createGlobalTheme, createGlobalThemeContract } from "@vanilla-extract/css";

export const vars = createGlobalThemeContract(
  {
    pallets: {
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
    },
    space: {
      small: null,
      medium: null,
      large: null,
    },
  },
  (_, path) => path.join("-"),
);

createGlobalTheme("html", vars.space, {
  small: "1rem",
  medium: "2rem",
  large: "4rem",
});
