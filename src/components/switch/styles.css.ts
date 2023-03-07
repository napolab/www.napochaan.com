import { createVar, style } from "@vanilla-extract/css";
import { calc } from "@vanilla-extract/css-utils";

import { focusRing, vars, visibilityHidden } from "@theme/css";

/**
 * @package
 */
export const container = style({
  display: "inline-flex",
  gap: "0.5rem",
  alignItems: "center",
});

/**
 * @package
 */
export const input = style([visibilityHidden]);

/**
 * @package
 */
export const focus = style([focusRing]);

const height = createVar();
const borderWidth = createVar();

/**
 * @package
 */
export const track = style({
  vars: {
    [height]: "1.5rem",
    [borderWidth]: "1px",
  },
  position: "relative",
  isolation: "isolate",
  display: "flex",
  height,
  width: calc.multiply(height, 2),
  border: `solid ${borderWidth} ${vars.pallets.border.main}`,
  borderRadius: calc.multiply(height, 2),
});

/**
 * @package
 */
export const trackChecked = style({
  background: vars.pallets.background.primary,
});

const thumbSize = createVar();
const thumbOffset = createVar();
/**
 * @package
 */
export const thumb = style({
  vars: {
    [thumbSize]: calc.subtract(calc.multiply(height, 0.8), calc.multiply(borderWidth, 2)),
    [thumbOffset]: calc.divide(calc.subtract(height, thumbSize, calc.multiply(borderWidth, 2)), 2),
  },
  position: "absolute",
  height: thumbSize,
  width: thumbSize,

  borderRadius: "100%",

  top: thumbOffset,
  left: thumbOffset,
  transition: "left 0.1s ease-in-out",
  background: vars.pallets.text.main,
});

/**
 * @package
 */
export const thumbChecked = style({
  left: calc.subtract("100%", thumbSize, thumbOffset),
});
