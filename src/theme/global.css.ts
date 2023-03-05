import { globalStyle } from "@vanilla-extract/css";

import { vars } from "./css";
import { easing } from "./utils";

globalStyle("html, body", {
  color: vars.pallets.text.primary,
  backgroundColor: vars.pallets.background.primary,
  transition: `color 0.3s ${easing.easeInOutCirc}, background-color 0.3s ${easing.easeInOutCirc}`,
  fontSize: 16,

  "@media": {
    "screen and (max-width: 768px)": {
      fontSize: 12,
    },
  },
});
