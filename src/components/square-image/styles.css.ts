import { createVar, style } from "@vanilla-extract/css";

import { vars } from "@theme/css";

const width = createVar();

/**
 * @package
 */
export const squareImageRoot = style({
  vars: {
    [width]: "10rem",
  },
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: vars.space.sm,
  width,
});

/**
 * @package
 */
export const imageRoot = style({
  overflow: "hidden",
  borderRadius: vars.borderRadius.sm,
});

/**
 * @package
 */
export const image = style({
  width,
  aspectRatio: "1 / 1",
  objectFit: "cover",
});

/**
 * @package
 */
export const captionRoot = style({
  width: "100%",
  color: "inherit",
  fontFamily: vars.font.body,
  fontWeight: 400,
  fontSize: vars.typography.body,
  lineHeight: 1.5,
  letterSpacing: "0.01em",
});
