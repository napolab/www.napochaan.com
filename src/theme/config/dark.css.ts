import { createGlobalTheme } from "@vanilla-extract/css";

import { vars } from "./base.css";

createGlobalTheme("html.dark", vars.pallets, {
  text: {
    primary: "#efefef",
  },
  background: {
    primary: "#2d2d2d",
  },
  border: {
    primary: "#efefef",
    focus: "rgb(25, 113, 194)",
  },
});
