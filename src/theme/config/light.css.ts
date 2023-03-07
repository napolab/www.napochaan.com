import { createGlobalTheme } from "@vanilla-extract/css";

import { vars } from "./base.css";

createGlobalTheme("html, html.light", vars.pallets, {
  text: {
    main: "#2d2d2d",
    primary: "#2d2d2d",
  },
  background: {
    main: "#f1f1f1",

    primary: "rgb(25, 113, 194)",
    secondary: "#5c5c5c",
  },
  border: {
    main: "rgba(33, 33, 33, 0.6)",
    focus: "rgb(25, 113, 194)",
  },
});
