import { globalStyle } from "@vanilla-extract/css";

import { vars } from "./css";

import "@theme/config/base.css";
import "@theme/config/dark.css";
import "@theme/config/light.css";

globalStyle("html, body", {
  scrollBehavior: "smooth",
  overflowX: "hidden",
});

globalStyle("body", {
  color: vars.pallets.text.main,
  backgroundColor: vars.pallets.background.main,
  fontFamily: vars.font.body,
  fontSize: "16px",
  fontWeight: 400,
});

globalStyle("body::-webkit-scrollbar", {
  display: "none",
});

globalStyle("*::selection", {
  color: vars.pallets.black,
  background: vars.pallets.accent1,
});
