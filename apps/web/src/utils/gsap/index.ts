import type gsapType from 'gsap';
import type { ScrambleTextPlugin as ScrambleTextPluginType } from 'gsap/ScrambleTextPlugin';
import type { ScrollToPlugin as ScrollToPluginType } from 'gsap/ScrollToPlugin';
import type { ScrollTrigger as ScrollTriggerType } from 'gsap/ScrollTrigger';

type Gsap = typeof gsapType;

// What each consumer family needs. A kit loads only its own plugin chunks on top of the
// one shared core, so the scramble (ScrambleText / EchoText) never fetches the scroll
// plugins and vice versa.
export type GsapKits = {
  // ScrambleText / EchoText decode.
  scramble: { gsap: Gsap; ScrambleTextPlugin: typeof ScrambleTextPluginType };
  // TypographyBand drift (scroll velocity) + grid snap (scrollTo).
  scroll: { gsap: Gsap; ScrollTrigger: typeof ScrollTriggerType; ScrollToPlugin: typeof ScrollToPluginType };
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

const loadScrollTrigger = once(async () => {
  const [gsap, { ScrollTrigger }] = await Promise.all([loadCore(), import('gsap/ScrollTrigger')]);
  gsap.registerPlugin(ScrollTrigger);
  return ScrollTrigger;
});

const loadScrollToPlugin = once(async () => {
  const [gsap, { ScrollToPlugin }] = await Promise.all([loadCore(), import('gsap/ScrollToPlugin')]);
  gsap.registerPlugin(ScrollToPlugin);
  return ScrollToPlugin;
});

const KIT_LOADERS: { [K in GsapKit]: () => Promise<GsapKits[K]> } = {
  scramble: once(async () => {
    const [gsap, ScrambleTextPlugin] = await Promise.all([loadCore(), loadScrambleTextPlugin()]);
    return { gsap, ScrambleTextPlugin };
  }),
  scroll: once(async () => {
    const [gsap, ScrollTrigger, ScrollToPlugin] = await Promise.all([loadCore(), loadScrollTrigger(), loadScrollToPlugin()]);
    return { gsap, ScrollTrigger, ScrollToPlugin };
  }),
};

// gsap and its plugins are dynamic imports, loaded once per document by the first
// consumer that actually animates — keeps gsap out of the initial chunk graph (site
// layout). A rejected chunk (e.g. a stale client after a redeploy) stays rejected;
// every consumer degrades to its static state.
export const loadGsap = <K extends GsapKit>(kit: K): Promise<GsapKits[K]> => KIT_LOADERS[kit]();
