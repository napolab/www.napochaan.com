import { createVar, style } from "@vanilla-extract/css";
import { calc } from "@vanilla-extract/css-utils";

import { focusRing, mediaQueries, vars } from "@theme/css";

const scrollbarSize = createVar();
/**
 * @package
 */
export const root = style({
  vars: {
    [scrollbarSize]: "10px",
  },
  position: "relative",
  isolation: "isolate",
  ":focus-visible": focusRing,
  paddingBottom: calc.add(scrollbarSize, vars.space.sm),
});

/**
 * @package
 */
export const scrollArea = style({
  display: "flex",
  gap: vars.space.md,

  "@media": {
    [mediaQueries.sm]: {
      gap: vars.space.sm,
    },
  },
});

/**
 * @package
 */
export const scrollbar = style({
  display: "flex",
  flexDirection: "column",
  height: scrollbarSize,
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
