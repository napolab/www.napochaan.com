import type { Theme } from "@theme";

export * from "./convert-hex-2-rgb";
export * from "./vanilla-extract";

export const isTheme = (value: unknown): value is Theme => {
  return typeof value === "string" && ["dark", "light"].includes(value);
};

export const getSystemTheme = (fallback: Theme): Theme => {
  if (typeof window === "undefined") return fallback;

  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export const easing = {
  easeInOutCirc: "cubic-bezier(0.79,0.14,0.15,0.86)",
};

