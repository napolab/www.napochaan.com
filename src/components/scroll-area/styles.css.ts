import { createVar, style, styleVariants } from "@vanilla-extract/css";
import { calc } from "@vanilla-extract/css-utils";

import { focusRing, vars } from "@theme/css";

const scrollbarSize = createVar();

const _root = style({
  vars: {
    [scrollbarSize]: "10px",
  },
  position: "relative",
  isolation: "isolate",
  ":focus-visible": focusRing,
});
/**
 * @package
 */
export const root = styleVariants({
  horizontal: [
    _root,
    {
      width: "100%",
      overflow: "hidden",
      paddingBottom: calc.add(scrollbarSize, vars.space.sm),
    },
  ],
  vertical: [
    _root,
    {
      height: "100%",
      overflow: "hidden",
      paddingRight: calc.add(scrollbarSize, vars.space.sm),
    },
  ],
});

/**
 * @package
 */
export const viewport = style({
  width: "100%",
  height: "100%",
});

const _scrollbar = style({
  display: "flex",
  userSelect: "none",
  touchAction: "none",
  padding: 2,
  borderRadius: vars.borderRadius.xl,
  background: vars.palettes.scrollbar.background.main,
  transition: "background 0.3s ease",

  ":hover": {
    background: vars.palettes.scrollbar.background.hover,
  },
});
/**
 * @package
 */
export const scrollbar = styleVariants({
  horizontal: [
    _scrollbar,
    {
      height: scrollbarSize,
      flexDirection: "column",
    },
  ],
  vertical: [
    _scrollbar,
    {
      width: scrollbarSize,
    },
  ],
});

/**
 * @package
 */
export const thumb = style({
  position: "relative",
  flex: 1,
  background: vars.palettes.scrollbar.thumb,
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
