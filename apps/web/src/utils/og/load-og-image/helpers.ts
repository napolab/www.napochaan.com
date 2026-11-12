export const isPayloadMedia = (absolute: string, origin: string): boolean => absolute.startsWith(origin) && new URL(absolute).pathname.startsWith('/api/media/file/');

export const toBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  const binary = bytes.reduce((acc, byte) => acc + String.fromCharCode(byte), '');

  return btoa(binary);
};

// Magic-byte sniff for the formats next/og's Satori can decode. Returns undefined
// for anything else (WebP/AVIF/GIF/…), so callers fall back to the no-image card
// instead of handing Satori bytes it will hang on. The media route's declared
// Content-Type is unreliable (stale Payload doc mimeType), so never trust it.
export const detectImageType = (buffer: ArrayBuffer): 'jpeg' | 'png' | undefined => {
  const bytes = new Uint8Array(buffer);
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpeg';
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'png';

  return undefined;
};
