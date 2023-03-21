import { globalStyle, style } from "@vanilla-extract/css";

import { vars } from "./config/base.css";

import type { StyleRule } from "@vanilla-extract/css";

globalStyle("html, body", {
  scrollBehavior: "smooth",
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
  color: vars.pallets.background.main,
  background: vars.pallets.accent1,
});

export const visibilityHidden = style({
  border: 0,
  clip: "rect(0px, 0px, 0px, 0px)",
  clipPath: "inset(50%)",
  height: 1,
  margin: "0px -1px -1px 0px",
  overflow: "hidden",
  padding: 0,
  position: "absolute",
  width: 1,
  whiteSpace: "nowrap",
});

export const focusRing: StyleRule = {
  display: "inline-block",
  outlineStyle: "solid",
  outlineWidth: 2,
  outlineColor: vars.pallets.border.focus,
  outlineOffset: -2,
};

export const link = style({
  display: "inline-block",
  color: vars.pallets.link.main,
  ":hover": {
    color: vars.pallets.link.hover,
  },
  ":focus-visible": focusRing,
});
