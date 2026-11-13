export type Rgb = { r: number; g: number; b: number };

const parseOklch = (value: string): readonly [number, number, number] => {
  const match = value.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/i);
  if (!match) throw new Error(`invalid oklch: ${value}`);
  const [, l, c, h] = match;
  if (l === undefined || c === undefined || h === undefined) throw new Error(`invalid oklch: ${value}`);
  return [parseFloat(l), parseFloat(c), parseFloat(h)] as const;
};

const clamp01 = (n: number): number => (n < 0 ? 0 : n > 1 ? 1 : n);

const encode = (lin: number): number => {
  const c = clamp01(lin);
  const v = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
  return Math.round(clamp01(v) * 255);
};

export const oklchToSrgb = (oklch: string): Rgb => {
  const [L, C, Hdeg] = parseOklch(oklch);
  const h = (Hdeg * Math.PI) / 180;
  const a = C * Math.cos(h);
  const bb = C * Math.sin(h);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * bb;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * bb;
  const s_ = L - 0.0894841775 * a - 1.291485548 * bb;

  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;

  const rLin = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bLin = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  return { r: encode(rLin), g: encode(gLin), b: encode(bLin) };
};

const channelLuminance = (c8: number): number => {
  const c = c8 / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

export const relativeLuminance = ({ r, g, b }: Rgb): number => 0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b);

export const contrastRatio = (fg: string, bg: string): number => {
  const lf = relativeLuminance(oklchToSrgb(fg));
  const lb = relativeLuminance(oklchToSrgb(bg));
  const hi = Math.max(lf, lb);
  const lo = Math.min(lf, lb);
  return (hi + 0.05) / (lo + 0.05);
};
