import { style } from "@vanilla-extract/css";

/**
 * @package
 */
export const container = style({
  //
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
