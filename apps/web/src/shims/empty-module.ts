// Empty module the client bundle resolves `linkedom` to. budoux's html_processor
// imports linkedom unconditionally, but our only client-reachable use
// (`@utils/phrase` → parser.parse) never touches it. See next.config.ts.
export {};
