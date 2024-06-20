import { style } from "@vanilla-extract/css";

import { ellipsis, ellipsisLine, vars } from "@theme/css";
export { link } from "@theme/css";

/**
 * @package
 */
export const content = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  gap: vars.space.md,
});

/**
 * @package
 */
export const thumbnail = style({
  position: "relative",
  width: "100%",
  aspectRatio: "1200 / 630",
  borderRadius: vars.borderRadius.sm,
  overflow: "hidden",
  background: vars.palettes.background.main,
  boxShadow: vars.palettes.shadow,
  cursor: "pointer",
});

/**
 * @package
 */
export const description = style({
  width: "100%",
  lineHeight: 1.8,
  letterSpacing: 1.2,
  whiteSpace: "pre-wrap",
});

/**
 * @package
 */
export const title = style([
  ellipsis,
  {
    vars: {
      [ellipsisLine]: "2",
    },
  },
]);

/**
 * @package
 */
export const dialogTitle = style({
  lineHeight: 1.2,
  fontSize: "0.8em",
});
