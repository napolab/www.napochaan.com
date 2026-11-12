import type { Context } from 'hono';

export const notFound = (c: Context) => c.json({ error: 'not_found' as const }, 404);

export const forbidden = (c: Context) => c.json({ error: 'forbidden' as const }, 403);
