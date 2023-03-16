import { style } from "@vanilla-extract/css";

import { vars } from "@theme/css";

/**
 * @package
 */
export const mainRoot = style({
  padding: `${vars.space.lg} ${vars.space.md} ${vars.space.md}`,
  "@media": {
    "screen and (min-width: 500px)": {
      padding: `${vars.space.lg} ${vars.space.md} ${vars.space.md}`,
    },
  },
});
