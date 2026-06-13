export const isPayloadMedia = (absolute: string, origin: string): boolean => absolute.startsWith(origin) && new URL(absolute).pathname.startsWith('/api/media/file/');

export const toBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  const binary = bytes.reduce((acc, byte) => acc + String.fromCharCode(byte), '');

  return btoa(binary);
};
