import { style } from "@vanilla-extract/css";

import { vars } from "@theme/css";
import { mediaQueries } from "@theme/utils";

/**
 * @package
 */
export const scrollArea = style({
  display: "flex",
  gap: vars.space.md,
  margin: `-${vars.space.xs}`,
  padding: vars.space.xs,

  "@media": {
    [mediaQueries.sm]: {
      gap: vars.space.sm,
    },
  },
});
