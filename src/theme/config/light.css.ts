import { createGlobalTheme } from "@vanilla-extract/css";

import { convertHex2Rgb } from "@theme/utils";

import { vars } from "./base.css";

import type { Palettes } from "./base.css";

export const light = {
  background: {
    main: "#FFFFFF",
    secondary: "#F5F5F5",
    tertiary: "#EEEEEE",
  },
  text: {
    main: "#333333",
    secondary: "#4F4F4F",
  },
  link: {
    main: "#336699",
    hover: "#004080",
  },
  warning: "#FF4136",
  accent1: "#FCD799",
  accent2: "#8BD3DD",
  accent3: "#9ED9CC",
  disabled: "#A5A5A5",
  white: "#ffffff",
  black: "#333333",
  border: {
    main: "#CCCCCC",
    focus: "#336699",
  },
  overlay: "#00000070",
  shadow: `0px ${vars.space.xs} ${vars.space.xs} rgba(${vars.palettes.rgb.black}, 0.25)`,
  scrollbar: {
    background: {
      main: "#D9D9D9",
      hover: "#BFBFBF",
    },
    thumb: "#8C8C8C",
  },
} as const satisfies Palettes;

createGlobalTheme(":root", vars.palettes, {
  ...light,
  rgb: convertHex2Rgb(light),
});
