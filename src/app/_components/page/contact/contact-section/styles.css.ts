import { style } from "@vanilla-extract/css";
import { calc } from "@vanilla-extract/css-utils";

import { mediaQueries } from "@theme/css";

import { characterLayer, section2 } from "../../../styles.css";

/**
 * @package
 */
export const contactRoot = style([
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
