import { style } from "@vanilla-extract/css";
import { calc } from "@vanilla-extract/css-utils";

import { focusRing, heading, mediaQueries, vars } from "@theme/css";

/**
 * @package
 */
export const overlay = style({
  position: "fixed",
  inset: 0,
  backgroundColor: vars.palettes.overlay,
  transition: "backdrop-filter 0.3s",

  "@media": {
    [mediaQueries.sm]: {
      backdropFilter: `blur(${vars.space.sm})`,
    },
  },
});

/**
 * @package
 */
export const trigger = style({
  background: "transparent",
  border: "none",
});

/**
 * @package
 */
export const content = style({
  position: "fixed",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",

  display: "flex",
  flexDirection: "column",
  gap: vars.space.md,

  width: "100%",
  maxWidth: `min(${calc.subtract("100%", calc.multiply(vars.space.md, 2))}, 512px)`,
  minHeight: "450px",
  height: "60vh",
  maxHeight: "600px",

  borderRadius: vars.borderRadius.md,
  background: vars.palettes.background.secondary,
  padding: vars.space.md,
  boxShadow: vars.palettes.shadow,

  "@supports": {
    "(height: 60svh)": {
      height: "60svh",
    },
  },

  "@media": {
    [mediaQueries.sm]: {
      top: "unset",
      left: 0,
      bottom: 0,
      maxWidth: "none",
      maxHeight: "none",
      minHeight: "none",
      width: "100%",
      height: "90vh",
      borderRadius: `${vars.borderRadius.md} ${vars.borderRadius.md} 0 0`,
      "@supports": {
        "(height: 100svh)": {
          height: "90svh !important",
        },
      },
    },
  },
});

/**
 * @package
 */
export const title = style([
  heading.h2,
  {
    fontFamily: vars.font.body,
    wordBreak: "break-word",
  },
]);

/**
 * @package
 */
export const header = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space.sm,
});

/**
 * @package
 */
export const titleRoot = style({
  display: "flex",
  justifyContent: "space-between",
  gap: vars.space.sm,
  alignItems: "flex-start",
});

/**
 * @package
 */
export const border = style({
  height: 1,
  background: vars.palettes.border.main,
});

/**
 * @package
 */
export const close = style({
  border: "none",
  background: "transparent",
  borderRadius: vars.borderRadius.sm,
  ":focus-visible": focusRing,
});

/**
 * @package
 */
export const icon = style({
  width: 44,
  height: 44,
});
