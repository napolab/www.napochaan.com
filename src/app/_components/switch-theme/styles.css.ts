import { style } from "@vanilla-extract/css";
import { calc } from "@vanilla-extract/css-utils";

import { vars } from "@theme/css";
import { mediaQueries } from "@theme/utils";

/**
 * @package
 */
export const switchTheme = style({
  position: "fixed",
  zIndex: 10,

  "@media": {
    [mediaQueries.xl]: {
      right: calc.divide(
        calc.subtract("100%", `min(1440px, ${calc.subtract("100vw", calc.multiply(vars.space.lg, 2))})`),
        2,
      ),
      bottom: vars.space.md,
    },
    [mediaQueries.lg]: {
      right: vars.space.lg,
      bottom: vars.space.md,
    },
    [mediaQueries.md]: {
      right: vars.space.lg,
      bottom: vars.space.md,
    },
    [mediaQueries.sm]: {
      right: vars.space.md,
      bottom: vars.space.md,
    },
  },
});
