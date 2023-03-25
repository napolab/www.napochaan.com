import { createVar, style } from "@vanilla-extract/css";
import { calc } from "@vanilla-extract/css-utils";

import { focusRing, heading, mediaQueries, vars } from "@theme/css";

/**
 * @package
 */
export const overlay = style({
  position: "fixed",
  inset: 0,
  backgroundColor: vars.pallets.overlay,
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
  maxHeight: "85vh",

  borderRadius: vars.borderRadius.md,
  background: vars.pallets.background.secondary,
  padding: vars.space.md,
  boxShadow: vars.pallets.shadow,

  "@media": {
    [mediaQueries.sm]: {
      top: "unset",
      left: 0,
      bottom: 0,
      maxWidth: "none",
      maxHeight: "none",
      width: "100%",
      height: "60vh",
      borderRadius: `${vars.borderRadius.md} ${vars.borderRadius.md} 0 0`,
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
  background: vars.pallets.border.main,
});

const scrollbarSize = createVar();
/**
 * @package
 */
export const scrollArea = style({
  vars: {
    [scrollbarSize]: "10px",
  },
  height: "100%",
  overflow: "hidden",
  paddingRight: calc.add(scrollbarSize, vars.space.sm),
});

/**
 * @package
 */
export const viewport = style({
  width: "100%",
  height: "100%",
});

/**
 * @package
 */
export const scrollbar = style({
  display: "flex",
  flexDirection: "column",
  width: scrollbarSize,
  userSelect: "none",
  touchAction: "none",
  padding: 2,
  borderRadius: vars.borderRadius.xl,
  background: vars.pallets.scrollbar.background.main,
  transition: "background 0.3s ease",

  ":hover": {
    background: vars.pallets.scrollbar.background.hover,
  },
});

/**
 * @package
 */
export const thumb = style({
  position: "relative",
  flex: 1,
  background: vars.pallets.scrollbar.thumb,
  borderRadius: "inherit",

  ":before": {
    content: "",
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "100%",
    height: "100%",
    minWidth: 44,
    minHeight: 44,
  },
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
