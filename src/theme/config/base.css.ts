import { createGlobalTheme, createGlobalThemeContract, globalStyle } from "@vanilla-extract/css";

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
    font: {
      notoSansJP: "noto-sans-jp",
    },
  },
  (value, path) => value ?? path.join("-"),
);

createGlobalTheme("html", vars.space, {
  small: "1rem",
  medium: "2rem",
  large: "4rem",
});

createGlobalTheme("html", vars.font, {
  notoSansJP: "'Noto Sans JP', sans-serif",
});

globalStyle("html, body", {
  color: vars.pallets.text.main,
  backgroundColor: vars.pallets.background.main,
  fontFamily: vars.font.notoSansJP,
});
