import hexRgb from "hex-rgb";

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
