import { createGlobalTheme } from "@vanilla-extract/css";

import { vars } from "./base.css";

createGlobalTheme("html, html.light", vars.pallets, {
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
});
