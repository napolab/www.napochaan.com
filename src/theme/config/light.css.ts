import { createGlobalTheme } from "@vanilla-extract/css";

import { vars } from "./base.css";

createGlobalTheme(":host, .light", vars.pallets, {
  text: {
    primary: "#2d2d2d",
  },
  background: {
    primary: "#f1f1f1",
  },
});
