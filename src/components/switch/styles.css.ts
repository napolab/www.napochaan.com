import { createVar, style, styleVariants } from "@vanilla-extract/css";
import { calc } from "@vanilla-extract/css-utils";

import { focusRing, vars, visibilityHidden } from "@theme/css";

/**
 * @package
 */
export const switchRoot = style({
  display: "inline-flex",
  gap: "0.5rem",
  alignItems: "center",
});

/**
 * @package
 */
export const input = style([visibilityHidden]);

const trackHeight = createVar();
const trackWidth = createVar();
const baseTrack = style({
  vars: {
    [trackHeight]: "1.5rem",
    [trackWidth]: calc.multiply(trackHeight, 2),
  },
  position: "relative",
  isolation: "isolate",
  height: trackHeight,
  display: "inline-flex",
  alignItems: "center",
  width: trackWidth,
  borderRadius: trackWidth,

  background: vars.pallets.background.secondary,
  boxShadow: `inset 0px 4px 4px rgba(0, 0, 0, 0.25)`,
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
  boxShadow: `0px 4px 4px rgba(0, 0, 0, 0.25)`,

  top: thumbOffset,
  willChange: "transform",
  transform: `translateX(${thumbOffset})`,
  transition: "transform 0.1s ease-in-out",
});

export const thumb = styleVariants({
  default: [baseThumb],
  checked: [
    baseThumb,
    {
      transform: `translateX(${calc.subtract(trackWidth, thumbSize, thumbOffset)})`,
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

export const label = styleVariants({
  default: {
    color: "inherit",
  },
  disabled: {
    color: vars.pallets.disabled,
  },
});
