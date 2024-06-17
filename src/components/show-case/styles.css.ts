import { style } from "@vanilla-extract/css";
import { calc } from "@vanilla-extract/css-utils";

import { vars } from "@theme/css";
import { mediaQueries } from "@theme/utils";

/**
 * @package
 */
export const scrollArea = style({
  display: "flex",
  gap: vars.space.md,
  margin: calc.negate(vars.space.xs),
  padding: vars.space.xs,

  "@media": {
    [mediaQueries.sm]: {
      gap: vars.space.sm,
    },
  },
});
