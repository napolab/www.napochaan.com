import { style } from "@vanilla-extract/css";

import { vars } from "@theme/css";
export { anchorLink, textLink, fillImage, link } from "@theme/css";

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
  aspectRatio: "16 / 9",
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
