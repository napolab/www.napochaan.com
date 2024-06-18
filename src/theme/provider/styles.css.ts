import { style } from "@vanilla-extract/css";

import { vars } from "@theme/css";

/**
 * @package
 */
export const providerRoot = style({
  color: vars.palettes.text.main,
  backgroundColor: vars.palettes.background.main,
  fontSize: 16,
  fontFamily: vars.font.body,
});
