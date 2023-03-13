import { style } from "@vanilla-extract/css";

import { vars } from "@theme/css";

/**
 * @package
 */
export const squareImageRoot = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: vars.space.sm,
  borderRadius: `${vars.borderRadius.sm} ${vars.borderRadius.sm} 0 0`,
  overflow: "hidden",
  width: "10rem",
});

/**
 * @package
 */
export const imageRoot = style({
  overflow: "hidden",
});

/**
 * @package
 */
export const image = style({
  width: "100%",
  aspectRatio: "1 / 1",
  objectFit: "cover",
});

/**
 * @package
 */
export const captionRoot = style({
  width: "100%",
  background: vars.pallets.background.main,
  color: vars.pallets.text.main,
  fontFamily: vars.font.body,
  fontWeight: 400,
  fontSize: "1rem",
  lineHeight: 1.5,
  letterSpacing: "0.01em",
});
