import { style } from "@vanilla-extract/css";

import { vars } from "./css";

/**
 * @package
 */
export const providerRoot = style({
  color: vars.pallets.text.main,
  backgroundColor: vars.pallets.background.main,
  fontSize: 16,
  fontFamily: vars.font.body,
});
