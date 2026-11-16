// `sha256:<lowercase hex>` of the UTF-8 bytes of `text` — the Agent Skills Discovery
// `digest` format. Web Crypto, so it runs the same in Workers and vitest.

const toHex = (buffer: ArrayBuffer): string => [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('');

export const sha256Digest = async (text: string): Promise<string> => `sha256:${toHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)))}`;
