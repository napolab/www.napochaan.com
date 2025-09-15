import { style } from "@vanilla-extract/css";
import { calc } from "@vanilla-extract/css-utils";

import { characterLayer, section2 } from "../../../styles.css";

/**
 * @package
 */
export const worksRoot = style([
  section2,
  {
    position: "relative",
    zIndex: calc.subtract(characterLayer, 1),
  },
]);
