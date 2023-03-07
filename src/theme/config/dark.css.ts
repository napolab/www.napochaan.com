import { createGlobalTheme } from "@vanilla-extract/css";

import { vars } from "./base.css";

createGlobalTheme("html.dark", vars.pallets, {
  text: {
    main: "#efefef",
    primary: "#efefef",
  },
  background: {
    main: "#2d2d2d",

    primary: "rgb(25, 113, 194)",
    secondary: "#efefef",
  },
  border: {
    main: "rgba(239, 239, 239, 0.6)",
    focus: "rgb(25, 113, 194)",
  },
});
