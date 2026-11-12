import { z } from 'zod';

import { CURSOR_COLORS } from './identity';

const Color = z.enum([...CURSOR_COLORS]);
const Identity = z.object({ id: z.string(), color: Color, label: z.string() });

// `path` is client-supplied (the SPA route can only be known client-side), so bound its length to
// reject oversized payloads. It only affects per-page cursor routing on public pages — there is no
// private data behind a path — so spoofing a path merely shows a cursor on a page.
const Path = z.string().max(2048);

// Every client message carries the sender's current `path`. `nav` reports a page change with no
// movement (so presence transitions fire even when idle); `move` carries a pointer position too.
export const ClientMessage = z.discriminatedUnion('t', [z.object({ t: z.literal('nav'), path: Path }), z.object({ t: z.literal('move'), path: Path, x: z.number(), y: z.number() })]);
export type ClientMessage = z.infer<typeof ClientMessage>;

export const ServerMessage = z.discriminatedUnion('t', [
  z.object({ t: z.literal('welcome'), self: Identity }),
  z.object({ t: z.literal('join'), id: z.string(), color: Color, label: z.string() }),
  z.object({ t: z.literal('move'), id: z.string(), x: z.number(), y: z.number() }),
  z.object({ t: z.literal('leave'), id: z.string() }),
  z.object({ t: z.literal('count'), n: z.number() }),
]);
export type ServerMessage = z.infer<typeof ServerMessage>;
