import type { Plugin } from '../../lib/first-match-runner';

// How the middleware treats the upstream response's Cache-Control for a path.
// - keep: leave whatever upstream sent (routes that manage their own policy, e.g. `/_next/image`).
// - fill: set the policy only when upstream sent none (media, Payload REST).
// - page: replace upstream (Next's force-dynamic `private, no-store, …`) on a cookie-less GET/HEAD 200.
// - deny: always set, whatever the status, method or cookies (drafts must never be stored).
export type CacheDirective = { kind: 'keep' } | { kind: 'fill'; policy: string } | { kind: 'page'; policy: string } | { kind: 'deny'; policy: string };

// 入力は percent-decode しない pathname(decode が要る判定は plugin 側で行う)。
export type CacheControlPlugin = Plugin<string, CacheDirective>;
