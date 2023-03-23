import { createVar, globalStyle, style } from "@vanilla-extract/css";

import { focusRing, vars } from "@theme/css";

const shadow = createVar();
/**
 * @package
 */
export const switchThemeRoot = style({
  vars: {
    [shadow]: `0px ${vars.space.sx} ${vars.space.sx} rgba(${vars.pallets.rgb.black}, 0.25)`,
  },
  background: vars.pallets.background.tertiary,
  display: "inline-flex",
  gap: vars.space.sx,
  padding: vars.space.sx,
  borderRadius: vars.borderRadius.sx,
  boxShadow: `inset ${shadow}`,
});

const button = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: vars.borderRadius.sx,
  width: 44,
  height: 44,
  background: "transparent",
  color: vars.pallets.disabled,
  border: "none",
  ":focus-visible": focusRing,
});

/**
 * @package
 */
export const lightButton = style([button]);
globalStyle(`${lightButton}[aria-checked="true"]`, {
  background: vars.pallets.accent1,
  color: vars.pallets.black,
  boxShadow: `${shadow}, ${shadow}`,
});

/**
 * @package
 */
export const darkButton = style([button]);
globalStyle(`${darkButton}[aria-checked="true"]`, {
  background: vars.pallets.black,
  color: vars.pallets.accent1,
  boxShadow: `${shadow}, ${shadow}`,
});

/**
 * @package
 */
export const icon = style({
  color: "inherit",
  width: "80%",
  height: "80%",
});
