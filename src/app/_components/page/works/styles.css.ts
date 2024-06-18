import { style } from "@vanilla-extract/css";
import { calc } from "@vanilla-extract/css-utils";

import { mediaQueries, vars } from "@theme/css";

import { characterLayer, section2, section3, tile } from "../../styles.css";
export { anchorLink, textLink, fillImage, link } from "@theme/css";

export { section3 };

/**
 * @package
 */
export const worksWrapper = style([
  section2,
  {
    position: "relative",
    zIndex: calc.subtract(characterLayer, 1),
  },
]);

/**
 * @package
 */
export const worksRoot = style([
  tile,
  {
    "@media": {
      [mediaQueries.xl]: {
        width: "58.875rem",
        borderRadius: `0px ${vars.space.md} ${vars.space.md} 0px`,
        display: "flex",
        flexDirection: "column",
        gap: calc.multiply(vars.space.md, 1.5),
      },
      [mediaQueries.lg]: {
        display: "flex",
        flexDirection: "column",
        gap: vars.space.md,
      },
      [mediaQueries.md]: {
        display: "flex",
        flexDirection: "column",
        gap: vars.space.md,
      },
      [mediaQueries.sm]: {
        display: "flex",
        flexDirection: "column",
        gap: vars.space.md,
      },
    },
  },
]);
