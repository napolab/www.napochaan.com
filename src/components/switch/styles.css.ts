import { createVar, style, styleVariants } from "@vanilla-extract/css";
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

const trackHeight = createVar();
const baseTrack = style({
  vars: {
    [trackHeight]: "1.5rem",
  },
  position: "relative",
  isolation: "isolate",
  height: trackHeight,
  display: "inline-flex",
  alignItems: "center",
  width: calc.multiply(trackHeight, 2),
  borderRadius: calc.multiply(trackHeight, 2),

  background: vars.pallets.background.secondary,
  boxShadow: `inset 0px ${calc.multiply(trackHeight, 0.085)} ${calc.multiply(trackHeight, 0.085)} rgba(0, 0, 0, 0.25)`,
});

export const track = styleVariants({
  small: [baseTrack, { vars: { [trackHeight]: "1.25rem" } }],
  medium: [baseTrack, { vars: { [trackHeight]: "1.5rem" } }],
  large: [baseTrack, { vars: { [trackHeight]: "2rem" } }],
  checked: [baseTrack, { background: vars.pallets.accent1 }],
  focus: [baseTrack, focusRing],
  disabled: [baseTrack, { background: vars.pallets.background.tertiary }],
});

const thumbSize = createVar();
const thumbOffset = createVar();
const baseThumb = style({
  vars: {
    [thumbSize]: calc.multiply(trackHeight, 0.8),
    [thumbOffset]: calc.divide(calc.subtract(trackHeight, thumbSize), 2),
  },
  position: "absolute",
  height: thumbSize,
  width: thumbSize,

  borderRadius: "100%",
  background: vars.pallets.white,
  boxShadow: `0px ${calc.multiply(trackHeight, 0.085)} ${calc.multiply(trackHeight, 0.085)} rgba(0, 0, 0, 0.25)`,

  top: thumbOffset,
  left: thumbOffset,
  transition: "left 0.1s ease-in-out",
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
