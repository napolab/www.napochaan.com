import { globalStyle } from "@vanilla-extract/css";

import { vars } from "./css";

import "@theme/config/base.css";
import "@theme/config/dark.css";
import "@theme/config/light.css";

globalStyle("html, body", {
  scrollBehavior: "smooth",
  overflowX: "hidden",
  transition: "color 0.2s, background-color 0.2s",
});

globalStyle("body", {
  color: vars.palettes.text.main,
  backgroundColor: vars.palettes.background.main,
  fontFamily: vars.font.body,
  fontSize: "16px",
  fontWeight: 400,
});

globalStyle("body::-webkit-scrollbar", {
  display: "none",
});

globalStyle("*::selection", {
  color: vars.palettes.black,
  background: vars.palettes.accent1,
});

globalStyle("button", {
  touchAction: "manipulation",
});

globalStyle("html:focus-within", {
  "@media": {
    "(prefers-reduced-motion: reduce)": {
      scrollBehavior: "auto",
    },
  },
});

globalStyle("*, *::before, *::after", {
  "@media": {
    "(prefers-reduced-motion: reduce)": {
      animationDuration: "0.01ms !important",
      animationIterationCount: "1 !important",
      transitionDuration: "0.01ms !important",
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      scrollBehavior: "auto !important",
    },
  },
});
