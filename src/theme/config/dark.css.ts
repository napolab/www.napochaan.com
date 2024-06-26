import { createGlobalTheme } from "@vanilla-extract/css";

import { convertHex2Rgb } from "@theme/utils";

import { vars } from "./base.css";

import type { Palettes } from "./base.css";

export const dark = {
  background: {
    main: "#333333",
    secondary: "#4F4F4F",
    tertiary: "#606060",
  },
  text: {
    main: "#FFFFFF",
    secondary: "#F5F5F5",
  },
  link: {
    main: "#66B2FF",
    hover: "#99CCFF",
  },
  warning: "#FF4136",
  accent1: "#FCD799",
  accent2: "#8BD3DD",
  accent3: "#9ED9CC",
  disabled: "#A5A5A5",
  white: "#ffffff",
  black: "#333333",
  overlay: "#00000070",
  shadow: `0px ${vars.space.xs} ${vars.space.xs} rgba(${vars.palettes.rgb.black}, 0.25)`,
  border: {
    main: "#CCCCCC",
    focus: "#66B2FF",
  },
  scrollbar: {
    background: {
      main: "#858585",
      hover: "#6D6D6D",
    },
    thumb: "#B3B3B3",
  },
} satisfies Palettes;

createGlobalTheme(":root.dark", vars.palettes, {
  ...dark,
  rgb: convertHex2Rgb(dark),
});
