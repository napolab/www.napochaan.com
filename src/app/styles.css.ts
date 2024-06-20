import { style } from "@vanilla-extract/css";

import { ellipsis, ellipsisLine, mediaQueries, vars } from "@theme/css";

import { characterLayer, fixedLayer } from "./_components/styles.css";

/**
 * @package
 */
export const pageRoot = style({
  vars: {
    [characterLayer]: "2",
    [fixedLayer]: "10",
  },
  position: "relative",
  isolation: "isolate",

  "@media": {
    [mediaQueries.xl]: {
      maxWidth: 1440,
      margin: "0 auto",
      background: vars.palettes.background.tertiary,
      borderRadius: vars.borderRadius.lg,
      paddingBottom: vars.space.xl,
    },
  },
});

export const workDialogContent = style([
  ellipsis,
  {
    vars: {
      [ellipsisLine]: "4",
    },
    wordBreak: "break-word",
    width: "100%",
  },
]);
