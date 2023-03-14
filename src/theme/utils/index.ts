import hexRgb from "hex-rgb";

import type { Theme } from "@theme";

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

const decimalize = (hex: string): string => {
  const { red, blue, green } = hexRgb(hex);

  return `${red}, ${green}, ${blue}`;
};
type Pallets = {
  [key: string]: Pallets | string;
};
export const convertHex2Rgb = <T extends Pallets>(pallets: T): T => {
  const next: [key: string, value: Pallets | string][] = [];

  for (const [key, pallet] of Object.entries(pallets)) {
    if (typeof pallet === "string") {
      next.push([key, decimalize(pallet)]);
    } else {
      next.push([key, convertHex2Rgb(pallet)]);
    }
  }

  return Object.fromEntries(next) as T;
};

type Primitive = string | boolean | number | null | undefined;
// vanilla-extract utils-types
export type MapLeafNodes<Obj, LeafType> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [Prop in keyof Obj]: Obj[Prop] extends Primitive
    ? LeafType
    : Obj[Prop] extends Record<string | number, any>
    ? MapLeafNodes<Obj[Prop], LeafType>
    : never;
};
