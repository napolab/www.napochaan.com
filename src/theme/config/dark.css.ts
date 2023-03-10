import { createGlobalTheme } from "@vanilla-extract/css";

import { vars } from "./base.css";

createGlobalTheme("html.dark", vars.pallets, {
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
  border: {
    main: "#CCCCCC",
    focus: "#66B2FF",
  },
});
