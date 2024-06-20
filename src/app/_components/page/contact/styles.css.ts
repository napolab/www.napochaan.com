import { style } from "@vanilla-extract/css";
import { calc } from "@vanilla-extract/css-utils";

import { mediaQueries, vars } from "@theme/css";

import { characterLayer, section2, tile } from "../../styles.css";
export { anchorLink, textLink, link } from "@theme/css";

/**
 * @package
 */
export const contactWrapper = style([
  section2,
  {
    position: "relative",
    zIndex: calc.add(characterLayer, 1),

    "@media": {
      [mediaQueries.xl]: {
        display: "flex",
        justifyContent: "flex-end",
      },
      [mediaQueries.lg]: {
        display: "flex",
        justifyContent: "flex-end",
      },
    },
  },
]);

/**
 * @package
 */
export const contactRoot = style([
  tile,
  {
    "@media": {
      [mediaQueries.xl]: {
        display: "flex",
        flexDirection: "column",
        gap: calc.multiply(vars.space.md, 1.5),
        width: "40rem",
        borderRadius: `${vars.borderRadius.md} 0px 0px ${vars.borderRadius.md}`,
      },
      [mediaQueries.lg]: {
        display: "flex",
        flexDirection: "column",
        gap: calc.multiply(vars.space.md, 1.5),
        width: "41.5rem",
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

/**
 * @package
 */
export const contactList = style({
  display: "flex",
  justifyContent: "flex-end",
  gap: calc.multiply(vars.space.md, 1.5),
});

/**
 * @package
 */
export const contactItem = style({
  "@media": {
    [mediaQueries.xl]: {
      width: 44,
      height: 44,
    },
    [mediaQueries.lg]: {
      width: 44,
      height: 44,
    },
    [mediaQueries.md]: {
      width: 36,
      height: 36,
    },
    [mediaQueries.sm]: {
      width: 36,
      height: 36,
    },
  },
});
