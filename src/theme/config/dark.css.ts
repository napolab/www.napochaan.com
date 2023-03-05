import { createGlobalTheme } from "@vanilla-extract/css";

import { vars } from "./base.css";

createGlobalTheme(".dark", vars.pallets, {
  text: {
    primary: "#efefef",
  },
  background: {
    primary: "#2d2d2d",
  },
});
