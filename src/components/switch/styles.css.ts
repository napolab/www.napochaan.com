import { createVar, style, styleVariants } from "@vanilla-extract/css";
import { calc } from "@vanilla-extract/css-utils";

import { focusRing, vars, visibilityHidden } from "@theme/css";

const height = createVar();

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

const baseTrack = style({
  vars: {
    [height]: "1.5rem",
  },
  position: "relative",
  isolation: "isolate",
  height,
  display: "inline-flex",
  alignItems: "center",
  width: calc.multiply(height, 2),
  borderRadius: calc.multiply(height, 2),

  background: vars.pallets.background.secondary,
  boxShadow: `inset 0px ${calc.multiply(height, 0.085)} ${calc.multiply(height, 0.085)} rgba(0, 0, 0, 0.25)`,
});

export const track = styleVariants({
  small: [baseTrack, { vars: { [height]: "1.25rem" } }],
  medium: [baseTrack],
  large: [baseTrack, { vars: { [height]: "2rem" } }],
  checked: [baseTrack, { background: vars.pallets.accent1 }],
  focus: [baseTrack, focusRing],
  disabled: [baseTrack, { background: vars.pallets.background.tertiary }],
});

const thumbSize = createVar();
const thumbOffset = createVar();
const baseThumb = style({
  vars: {
    [thumbSize]: calc.multiply(height, 0.8),
    [thumbOffset]: calc.divide(calc.subtract(height, thumbSize), 2),
  },
  position: "absolute",
  height: thumbSize,
  width: thumbSize,

  borderRadius: "100%",

  top: thumbOffset,
  left: thumbOffset,
  transition: "left 0.1s ease-in-out",
  background: vars.pallets.white,
  boxShadow: `0px ${calc.multiply(height, 0.085)} ${calc.multiply(height, 0.085)} rgba(0, 0, 0, 0.25)`,
});

export const thumb = styleVariants({
  default: [baseThumb],
  checked: [
    baseThumb,
    {
      left: calc.subtract("100%", thumbSize, thumbOffset),
    },
  ],
  disabled: [
    baseThumb,
    {
      boxShadow: "none",
      background: vars.pallets.disabled,
    },
  ],
});
