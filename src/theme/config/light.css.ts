import { createGlobalTheme } from "@vanilla-extract/css";

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
  black: "#333333",
  border: {
    main: "#CCCCCC",
    focus: "#336699",
  },
  overlay: "rgba(0, 0, 0, 0.44)",
  scrollbar: {
    background: {
      main: "#B3B3B3",
      hover: "#cccccc",
    },
    thumb: "#666666",
  },
} as const satisfies Pallets;

createGlobalTheme(":root", vars.pallets, {
  ...pallets,
  rgb: convertHex2Rgb(pallets),
});
