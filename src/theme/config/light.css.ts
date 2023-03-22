import { createGlobalTheme, globalStyle } from "@vanilla-extract/css";

import { convertHex2Rgb } from "@theme/utils";

import { vars } from "./base.css";

import type { Pallets } from "./base.css";

export const pallets = {
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
  border: {
    main: "#CCCCCC",
    focus: "#336699",
  },
  scrollbar: {
    background: {
      main: "#808080",
      hover: "#404040",
    },
    thumb: "#bfbfbf",
  },
} as const satisfies Pallets;

createGlobalTheme(":root", vars.pallets, {
  ...pallets,
  rgb: convertHex2Rgb(pallets),
});

globalStyle(":root", {
  colorScheme: "light",
});
