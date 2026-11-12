import { z } from 'zod';

export const previewHeaderSchema = z.object({ 'x-preview-secret': z.string().min(1) });

// `GET /news?limit=N`: absent → the full list; present → the newest N (1–50).
export const newsListQuerySchema = z.object({ limit: z.coerce.number().int().min(1).max(50).optional() });
