// Marks an <img> whose inline style still paints the blur placeholder.
export const BLUR_ATTRIBUTE = 'data-blur';

// Inline style properties the blur placeholder sets (see ./index.tsx).
const BLUR_PROPERTIES = ['background-image', 'background-size', 'background-position', 'background-repeat'];

// Clears the blur placeholder of server-rendered Images that never hydrate (an Astro
// React component without `client:*` ships no JS, so its onLoad / ref never run).
// Inject once in the site layout <head> via dangerouslySetInnerHTML / set:html. It:
// - listens for `load` in the capture phase (load does not bubble) on the document,
// - sweeps already-complete images now, on DOMContentLoaded and after every
//   ClientRouter swap (`astro:page-load`).
// Failed images keep the blur. Hydrated Images still clear themselves; whichever
// runs first wins and the other is a no-op. Self-contained IIFE string (mirrors
// motionBootScriptHtml) so lint does not parse it.
const script = `(function(){if(window.__imageBlur)return;window.__imageBlur=true;var A=${JSON.stringify(BLUR_ATTRIBUTE)},P=${JSON.stringify(BLUR_PROPERTIES)};function c(i){if(!i.hasAttribute(A))return;for(var k=0;k<P.length;k++)i.style.removeProperty(P[k]);i.removeAttribute(A);}function s(){var l=document.querySelectorAll('img['+A+']');for(var k=0;k<l.length;k++){if(l[k].complete&&l[k].naturalWidth>0)c(l[k]);}}document.addEventListener('load',function(e){var t=e.target;if(t&&t.tagName==='IMG')c(t);},true);document.addEventListener('DOMContentLoaded',s);document.addEventListener('astro:page-load',s);s();})();`;

export const imageBlurScriptHtml = { __html: script };
