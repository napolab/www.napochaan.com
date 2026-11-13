import type gsapType from 'gsap';
import type { ScrambleTextPlugin as ScrambleTextPluginType } from 'gsap/ScrambleTextPlugin';

type Gsap = typeof gsapType;

// What each consumer family needs. A kit loads only its own plugin chunks on top of the
// one shared core. (The TypographyBand drift / grid snap no longer uses gsap — it runs on
// plain rAF + scroll listeners, see components/typography-band/bind-band.ts — so there is
// no scroll kit and ScrollTrigger / ScrollToPlugin are never bundled.)
export type GsapKits = {
  // ScrambleText / EchoText decode.
  scramble: { gsap: Gsap; ScrambleTextPlugin: typeof ScrambleTextPluginType };
};

export type GsapKit = keyof GsapKits;

// Memoizes an async loader: one promise per document, shared by every caller.
const once = <T>(load: () => Promise<T>): (() => Promise<T>) => {
  const cache: { promise: Promise<T> | undefined } = { promise: undefined };
  return () => {
    if (cache.promise === undefined) cache.promise = load();
    return cache.promise;
  };
};

const loadCore = once(async () => (await import('gsap')).default);

// Each plugin registers on the shared core exactly once, the moment its chunk lands.
const loadScrambleTextPlugin = once(async () => {
  const [gsap, { ScrambleTextPlugin }] = await Promise.all([loadCore(), import('gsap/ScrambleTextPlugin')]);
  gsap.registerPlugin(ScrambleTextPlugin);
  return ScrambleTextPlugin;
});

const KIT_LOADERS: { [K in GsapKit]: () => Promise<GsapKits[K]> } = {
  scramble: once(async () => {
    const [gsap, ScrambleTextPlugin] = await Promise.all([loadCore(), loadScrambleTextPlugin()]);
    return { gsap, ScrambleTextPlugin };
  }),
};

// gsap and its plugins are dynamic imports, loaded once per document by the first
// consumer that actually animates — keeps gsap out of the initial chunk graph (site
// layout). A rejected chunk (e.g. a stale client after a redeploy) stays rejected;
// every consumer degrades to its static state.
export const loadGsap = <K extends GsapKit>(kit: K): Promise<GsapKits[K]> => KIT_LOADERS[kit]();
