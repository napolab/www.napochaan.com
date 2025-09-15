import { createVar, style, styleVariants } from "@vanilla-extract/css";

import { vars } from "@theme/css";

const layer = createVar();
const size = createVar();
const offset = createVar();

const baseThumb = style({
  vars: {
    [layer]: "2",
    [size]: "44px",
    [offset]: vars.space.xs,
  },
  position: "absolute",
  zIndex: layer,

  width: size,
  height: size,
  borderRadius: vars.borderRadius.xs,
  boxShadow: `${vars.palettes.shadow}, ${vars.palettes.shadow}`,
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