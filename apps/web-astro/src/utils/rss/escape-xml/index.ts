// Escapes XML-significant characters. `&` MUST be replaced first so the entity
// ampersands introduced by the later replacements are not double-escaped.
export const escapeXml = (value: string): string => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
