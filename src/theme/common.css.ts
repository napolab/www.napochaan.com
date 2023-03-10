import { style } from "@vanilla-extract/css";

import { vars } from "./config/base.css";

import type { StyleRule } from "@vanilla-extract/css";

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
  outlineStyle: "solid",
  outlineWidth: 2,
  outlineColor: vars.pallets.border.focus,
  outlineOffset: -2,
};

export const link = style({
  color: vars.pallets.link.main,
  textDecoration: "none",
  ":hover": {
    color: vars.pallets.link.hover,
  },
  ":focus-visible": focusRing,
});
