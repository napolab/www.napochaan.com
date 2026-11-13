// Browser stand-in for `linkedom` (aliased for the client build only, see
// src/config/client-aliases). budoux's dom.js imports `{ DOMParser }` from
// linkedom unconditionally; Rollup rejects a missing named export, so hand it the
// browser's native DOMParser. Our only client-reachable use (`@utils/phrase` →
// parser.parse) never touches it anyway.
export const DOMParser = globalThis.DOMParser;
