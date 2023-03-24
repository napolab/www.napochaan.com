import { globalStyle, style } from "@vanilla-extract/css";

import { vars } from "./config/base.css";

import type { StyleRule } from "@vanilla-extract/css";

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

export const focusRing: StyleRule = {
  outlineStyle: "solid",
  outlineWidth: 2,
  outlineColor: vars.pallets.border.focus,
  outlineOffset: -2,
};

export const link = style({
  display: "inline-block",
  color: vars.pallets.link.main,
  ":hover": { color: vars.pallets.link.hover },
  ":focus-visible": focusRing,
});

export const fillImage = style({
  objectFit: "contain",
  width: "100%",
});

export const textLink = style([link, { color: vars.pallets.text.main }]);

export const anchorLink = style([
  link,
  {
    display: "inline-block",
    color: vars.pallets.text.main,
    textDecoration: "none",
  },
]);
