import type { Payload } from 'payload';

// Runs `fn` against a ready Payload instance. Injected into every service so the
// services stay testable with a fake Payload; production binds it to `withPayload`
// (src/rpc/local-payload), which sets up OpenNext's Cloudflare request context first.
export type PayloadRunner = <T>(fn: (payload: Payload) => Promise<T>) => Promise<T>;
