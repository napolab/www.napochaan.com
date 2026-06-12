export type OgFont = { name: string; data: ArrayBuffer; weight: 400 | 700; style: 'normal' };

// Loads the two Satori fonts from the site's own ASSETS (served from public/og).
// `origin` is the request origin (e.g. https://napochaan.com). Results are cached
// by the OG route's ISR entry, so this fetch runs only on (re)generation.
export const loadOgFonts = async (origin: string): Promise<OgFont[]> => {
  const [jp, mono] = await Promise.all([fetch(`${origin}/og/LINESeedJP-Bold.otf`).then((r) => r.arrayBuffer()), fetch(`${origin}/og/GeistMono-subset.ttf`).then((r) => r.arrayBuffer())]);

  return [
    { name: 'LINE Seed JP', data: jp, weight: 700, style: 'normal' },
    { name: 'Geist Mono', data: mono, weight: 400, style: 'normal' },
  ];
};
