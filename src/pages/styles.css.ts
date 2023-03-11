import { style } from "@vanilla-extract/css";

import { vars } from "@theme/css";

/**
 * @package
 */
export const pageRoot = style({
  fontFamily: vars.font.notoSansJP,
});

/**
 * @package
 */
export const section = style({
  height: "100vh",
  "@supports": {
    "(height: 100svg)": {
      height: "100svg",
    },
  },
});
