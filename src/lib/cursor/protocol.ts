import { z } from 'zod';

import { CURSOR_COLORS } from './identity';

const Color = z.enum([...CURSOR_COLORS]);
const Identity = z.object({ id: z.string(), color: Color, label: z.string() });

export const ClientMessage = z.object({
  t: z.literal('move'),
  nx: z.number(),
  ny: z.number(),
});
export type ClientMessage = z.infer<typeof ClientMessage>;

export const ServerMessage = z.discriminatedUnion('t', [
  z.object({ t: z.literal('welcome'), self: Identity }),
  z.object({ t: z.literal('join'), id: z.string(), color: Color, label: z.string() }),
  z.object({ t: z.literal('move'), id: z.string(), nx: z.number(), ny: z.number() }),
  z.object({ t: z.literal('leave'), id: z.string() }),
  z.object({ t: z.literal('count'), n: z.number() }),
]);
export type ServerMessage = z.infer<typeof ServerMessage>;
