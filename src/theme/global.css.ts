import { globalStyle } from "@vanilla-extract/css";

import { vars } from "./css";
import { easing } from "./utils";

globalStyle("html, body", {
  color: vars.pallets.text.primary,
  backgroundColor: vars.pallets.background.primary,
  fontSize: 16,

  "@media": {
    "screen and (max-width: 768px)": {
      fontSize: 12,
    },
  },
});
