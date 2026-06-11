// Mirrors the localStorage motion override (MOTION_STORAGE_KEY) into a cookie so the
// pre-hydration boot script (motionBootScriptHtml, injected in <head>) can set
// --motion-play before the first paint — killing the flash of motion a motion:off
// visitor would otherwise see before MotionProvider hydrates. Only the EXPLICIT
// override lives here: true → 'on', false → 'off'. A null override deletes the
// cookie, so with no explicit choice the OS @media(prefers-reduced-motion) baseline
// in global-css governs (we never read this cookie server-side — that would make the
// (site) routes dynamic and break ISR).

export const MOTION_COOKIE = 'motion';

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export const writeMotionCookie = (override: boolean | null): void => {
  if (override === null) {
    document.cookie = `${MOTION_COOKIE}=; path=/; max-age=0; samesite=lax`;
    return;
  }

  const value = override === true ? 'on' : 'off';
  document.cookie = `${MOTION_COOKIE}=${value}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
};

// Self-contained IIFE string injected via dangerouslySetInnerHTML into <head>; it
// runs synchronously before paint and cannot import module code (mirrors the var /
// IIFE shape of @themes/typekit, kept as a string so lint does not parse it).
const script = `(function(){try{var m=document.cookie.match(/(?:^|; )${MOTION_COOKIE}=([^;]+)/);if(m)document.documentElement.style.setProperty('--motion-play',m[1]==='off'?'paused':'running');}catch(e){}})();`;

export const motionBootScriptHtml = { __html: script };
