import { globalStyle } from "@vanilla-extract/css";

import { vars } from "./css";

globalStyle("html, body", {
  color: vars.pallets.text.main,
  backgroundColor: vars.pallets.background.main,
  fontSize: 16,

  "@media": {
    "screen and (max-width: 768px)": {
      fontSize: 12,
    },
  },
});

globalStyle("a", {
  color: vars.pallets.link.main
});
globalStyle("a:hover", {
  color: vars.pallets.link.hover
});

globalStyle("html.light", {
  colorScheme: "light"
});
globalStyle("html.dark", {
  colorScheme: "dark"
});