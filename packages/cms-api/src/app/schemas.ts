import { z } from 'zod';

export const previewHeaderSchema = z.object({ 'x-preview-secret': z.string().min(1) });

export const latestQuerySchema = z.object({ limit: z.coerce.number().int().min(1).max(50) });
