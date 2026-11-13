// Keeps the document-level state that inline boot scripts and islands write onto
// <html> / <head> alive across Astro ClientRouter navigations.
//
// On every soft navigation Astro's `swapRootAttributes` deletes all attributes of
// the live <html> and copies the incoming document's — and the incoming document is
// the cacheable SSR markup, still `class="… wf-loading boot"` with no inline style.
// The Typekit loader and motion boot script do NOT run again (Astro dedupes inline
// scripts), so without this the boot overlay would come back and never lift, the
// `wf-active` font classes would be lost, and `--motion-play` / `--scroll-range`
// would be wiped. `swapHeadElements` likewise drops head nodes the incoming head
// lacks, which includes whatever the Typekit kit injected at runtime.
//
// So on `astro:before-swap` the live <html> class + style and the Typekit head nodes
// are copied into `event.newDocument` before Astro swaps it in. Installed once from
// the layout <head> as an inline script (no `data-astro-rerun`); a window flag guards
// against a second install. Kept as a string for the same reason as @themes/typekit.
const script = `(function(){if(window.__rootStateCarry)return;window.__rootStateCarry=true;document.addEventListener('astro:before-swap',function(e){var d=e.newDocument,live=document.documentElement,next=d.documentElement,style=live.getAttribute('style');next.className=live.className;if(style===null)next.removeAttribute('style');else next.setAttribute('style',style);var nodes=document.head.querySelectorAll('link[href*="typekit.net"],style');for(var i=0;i<nodes.length;i++){var n=nodes[i];if(n.tagName==='STYLE'&&n.textContent.indexOf('typekit.net')<0)continue;d.head.appendChild(n.cloneNode(true));}});})();`;

export const rootStateCarryScriptHTML = { __html: script };
