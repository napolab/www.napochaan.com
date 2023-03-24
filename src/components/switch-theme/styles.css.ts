import { createVar, style, styleVariants } from "@vanilla-extract/css";
import { calc } from "@vanilla-extract/css-utils";

import { focusRing, vars } from "@theme/css";

const shadow = createVar();
const layer = createVar();
const size = createVar();
const offset = createVar();
/**
 * @package
 */
export const switchThemeRoot = style({
  vars: {
    [shadow]: `0px ${vars.space.xs} ${vars.space.xs} rgba(${vars.pallets.rgb.black}, 0.25)`,
    [layer]: "2",
    [size]: "44px",
    [offset]: vars.space.xs,
  },
  isolation: "isolate",
  position: "relative",
  background: vars.pallets.background.tertiary,
  display: "inline-flex",
  gap: vars.space.xs,
  padding: offset,
  borderRadius: vars.borderRadius.xs,
  boxShadow: `inset ${shadow}`,
});

const baseThumb = style({
  position: "absolute",
  zIndex: layer,

  width: size,
  height: size,
  borderRadius: vars.borderRadius.xs,
  boxShadow: `${shadow}, ${shadow}`,
});
/**
 * @package
 */
export const thumb = styleVariants({
  dark: [
    baseThumb,
    {
      top: offset,
      right: offset,
    },
  ],
  light: [
    baseThumb,
    {
      top: offset,
      left: offset,
    },
  ],
});

/**
 * @package
 */
export const button = style({
  position: "relative",
  zIndex: calc.add(layer, 1),

  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: vars.borderRadius.xs,
  width: size,
  height: size,
  background: "transparent",
  border: "none",
  ":focus-visible": focusRing,
});

/**
 * @package
 */
export const icon = style({
  color: "inherit",
  width: "80%",
  height: "80%",
});
