import { style } from "@vanilla-extract/css";

import { vars } from "@theme/css";

/**
 * @package
 */
export const container = style({
  display: "flex",
  gap: "0.5rem"
});

/**
 * @package
 */
export const input = style({
  border: 0,
  clip: "rect(0px, 0px, 0px, 0px)",
  clipPath: "inset(50%)",
  height: 1,
  margin: "0px -1px -1px 0px",
  overflow: "hidden",
  padding: 0,
  position: "absolute",
  width: 1,
  whiteSpace: "nowrap",
});

/**
 * @package
 */
export const trackWrapper = style({

});

/**
 * @package
 */
export const focus = style({
  outlineStyle: "solid",
  outlineOffset: "0.125rem",
  outlineColor: vars.pallets.border.focus,
});

/**
 * @package
 */
export const track = style({
  display: "flex",
  width: "3rem",
  height: "1.5rem",
  borderRadius: "10rem",
  border: "solid",
  borderColor: vars.pallets.border.primary,
});

/**
 * @package
 */
export const thumb = style({});

/**
 * @package
 */
export const label = style({
  // 
});