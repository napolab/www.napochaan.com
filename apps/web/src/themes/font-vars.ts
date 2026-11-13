// Single source of truth for the CSS custom property name behind the `titleJP`
// font token (see themes/tokens/index.ts). fonts.css declares the same name as a
// literal (plain CSS cannot import it); font-vars.test.ts statically asserts the
// two match so a drift fails loudly.
export const TITLE_JP_VAR = '--font-zen-kaku-gothic-new';
