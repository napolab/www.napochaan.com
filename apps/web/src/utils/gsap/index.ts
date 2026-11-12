import type gsapType from 'gsap';
import type { ScrambleTextPlugin as ScrambleTextPluginType } from 'gsap/ScrambleTextPlugin';
import type { ScrollToPlugin as ScrollToPluginType } from 'gsap/ScrollToPlugin';
import type { ScrollTrigger as ScrollTriggerType } from 'gsap/ScrollTrigger';

export type GsapBundle = {
  gsap: typeof gsapType;
  ScrambleTextPlugin: typeof ScrambleTextPluginType;
  ScrollTrigger: typeof ScrollTriggerType;
  ScrollToPlugin: typeof ScrollToPluginType;
};

const load = async (): Promise<GsapBundle> => {
  const [{ default: gsap }, { ScrambleTextPlugin }, { ScrollTrigger }, { ScrollToPlugin }] = await Promise.all([
    import('gsap'),
    import('gsap/ScrambleTextPlugin'),
    import('gsap/ScrollTrigger'),
    import('gsap/ScrollToPlugin'),
  ]);
  gsap.registerPlugin(ScrambleTextPlugin, ScrollTrigger, ScrollToPlugin);

  return { gsap, ScrambleTextPlugin, ScrollTrigger, ScrollToPlugin };
};

// One shared promise: gsap and its plugins are loaded once per document, after the
// first component that needs them mounts. Keeps gsap out of the initial chunk graph
// (site layout) — nothing animates before the boot overlay lifts anyway.
const cache: { promise: Promise<GsapBundle> | undefined } = { promise: undefined };

export const loadGsap = (): Promise<GsapBundle> => {
  if (cache.promise === undefined) cache.promise = load();
  return cache.promise;
};
