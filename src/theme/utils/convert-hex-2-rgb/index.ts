import hexRgb from "hex-rgb";

const decimalize = (color: string): string => {
  if (color.startsWith("#")) {
    const { red, blue, green } = hexRgb(color);

    return `${red}, ${green}, ${blue}`;
  }

  return color;
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
