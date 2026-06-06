export const CURSOR_COLORS = ['blue', 'red', 'violet', 'teal', 'magenta', 'green'] as const;
export type CursorColor = (typeof CURSOR_COLORS)[number];
export type Identity = { id: string; color: CursorColor; label: string };

export const deriveIdentity = (uid: string): Identity => {
  const label = `#${uid.slice(0, 4)}`;
  const idx = parseInt(uid.slice(4, 8) || '0', 16) % CURSOR_COLORS.length;
  const color = CURSOR_COLORS[idx] ?? CURSOR_COLORS[0];
  return { id: uid, color, label };
};

export const hashIp = async (ip: string, salt: string): Promise<string> => {
  const data = new TextEncoder().encode(`${ip}:${salt}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(digest);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 16);
};
