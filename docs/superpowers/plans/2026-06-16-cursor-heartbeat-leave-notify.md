# Cursor Heartbeat Leave/Count Notify Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When durabcast's heartbeat reaps an abruptly-disconnected cursor socket, broadcast the `leave` + `count` that `webSocketClose` would have sent, so ghost cursors no longer linger on peers' screens.

**Architecture:** Override `alarm()` in `CursorRoom`. It computes the dead-socket set with the base's own `isAliveSocket` predicate, broadcasts presence `leave`/`count` for them (excluding the dead set so the timing of `ws.close()` is irrelevant), then delegates to `super.alarm()` which actually closes the sockets and re-arms the heartbeat. The three presence helpers are generalized from a single-socket exclude to a `ReadonlySet<WebSocket>` exclude so the same "last socket on a page" predicate serves both single-close and batch-reap.

**Tech Stack:** Cloudflare Durable Objects, durabcast `BroadcastMessage`, `@cloudflare/vitest-pool-workers` (`cloudflare:test`: `runInDurableObject`, `runDurableObjectAlarm`), TypeScript (tsgo), oxlint/oxfmt.

**Spec:** `docs/superpowers/specs/2026-06-16-cursor-heartbeat-leave-notify-design.md`

---

## File Structure

- **Modify** `worker/durable-objects/cursor-room.ts`
  - Generalize `#broadcastToPath`, `#countOnPath`, `#hasUidOnPath`, `#broadcastCount`: `exclude?: WebSocket` / `exclude: WebSocket` → `excludes?: ReadonlySet<WebSocket>` / `excludes: ReadonlySet<WebSocket>`.
  - Update existing callers (`#applyPath`, `#handleMove`, `webSocketClose`) to pass `new Set([ws])`.
  - Add `override async alarm()` and `#notifyEvicted(dead)`.
- **Modify** `worker/durable-objects/cursor-room.test.ts`
  - Add `stubFor` + `killByUid` test helpers and `runInDurableObject` / `runDurableObjectAlarm` imports.
  - Add reap tests: leave-on-abrupt-disconnect, no-leave-when-a-same-uid-tab-survives, no-notify-when-none-dead.

## Background the implementer needs

`CursorRoom extends BroadcastMessage` (durabcast). The base keeps sockets alive via `setWebSocketAutoResponse('ping'/'pong')` and an `alarm()` that runs every 30s: it closes sockets failing `isAliveSocket(ws)` (no ping within 60s) with `ws.close()`. A server-initiated `ws.close()` does **NOT** invoke the DO's own `webSocketClose`, so the subclass's `leave`/`count` broadcast never fires for heartbeat-reaped sockets → ghost cursors. Presence is keyed by `uid` (one visitor = many tabs sharing an IP-derived uid), so a `leave` must fire only when a uid's **last** socket on a page is gone.

`isAliveSocket` falls back to the attachment's `connectedAt` when the socket has never been pinged (`getWebSocketAutoResponseTimestamp(ws)` is null). Test sockets never ping, so backdating `connectedAt` beyond the 60s `TIMEOUT` makes a socket "dead" deterministically, with no real wait.

---

## Task 1: Red — failing test for leave/count on abrupt disconnect

**Files:**

- Modify: `worker/durable-objects/cursor-room.test.ts` (imports + helpers near top; new test inside the `describe('CursorRoom', ...)` block)

- [ ] **Step 1: Add imports and test helpers**

At the top of `worker/durable-objects/cursor-room.test.ts`, change the `cloudflare:test` import to also pull the DO runners:

```ts
import { env, runDurableObjectAlarm, runInDurableObject } from 'cloudflare:test';
```

Then, just after the existing `connect` helper (after its closing `};` near line 14), add:

```ts
// Return type left to inference: env.CURSOR_ROOM.get(...) yields DurableObjectStub<CursorRoom>,
// which runInDurableObject/runDurableObjectAlarm consume directly. Annotating it as the bare
// `DurableObjectStub` can trip the generic default, so don't.
const stubFor = (room: string) => env.CURSOR_ROOM.get(env.CURSOR_ROOM.idFromName(room));

// Force server-side socket(s) "dead" by backdating connectedAt past the 60s TIMEOUT, so the next
// alarm reaps them. Test sockets never ping, so isAliveSocket falls back to connectedAt. `limit`
// caps how many matching sockets are killed — used to kill only ONE of a uid's several tabs.
const killByUid = async (room: string, uid: string, limit = Infinity): Promise<void> => {
  await runInDurableObject(stubFor(room), (_instance, state) => {
    const matches = [...state.getWebSockets()].filter((ws) => ws.deserializeAttachment().uid === uid);
    for (const ws of matches.slice(0, limit)) {
      const att = ws.deserializeAttachment();
      ws.serializeAttachment({ ...att, connectedAt: new Date(Date.now() - 120_000) });
    }
  });
};
```

Reuse the existing `connect`, `nav`, `settle`, `wait` helpers; refactor `connect` to use `stubFor` for DRYness:

```ts
const connect = async (room: string, uid: string): Promise<WebSocket> => {
  const stub = stubFor(room);
  const url = new URL(`/rooms/${room}`, 'https://cursor.do');
  url.searchParams.set('uid', uid);
  const res = await stub.fetch(new Request(url, { headers: { Upgrade: 'websocket' } }));
  const ws = res.webSocket;
  if (!ws) throw new Error('no webSocket on response');
  ws.accept();

  return ws;
};
```

- [ ] **Step 2: Add the failing test**

Inside the `describe('CursorRoom', ...)` block (e.g. just before its closing `});` at line 252), add:

```ts
it('emits leave + recounted count when the heartbeat reaps an abruptly-disconnected socket', async () => {
  const room = 'reap-leave';
  const aUid = 'aaaa1111aaaa1111';
  const bUid = 'bbbb2222bbbb2222';

  const a = await connect(room, aUid);
  const b = await connect(room, bUid);
  nav(a, '/x');
  nav(b, '/x');
  await settle();

  const bSeen: string[] = [];
  b.addEventListener('message', (e) => bSeen.push(`${e.data}`));

  // a never sent a close frame; mark it dead and run the heartbeat reaper.
  await killByUid(room, aUid);
  await runDurableObjectAlarm(stubFor(room));
  await settle();

  const parsed = bSeen.map((s) => JSON.parse(s));
  expect(parsed.filter((m) => m.t === 'leave')).toContainEqual({ t: 'leave', id: aUid });
  expect(parsed.filter((m) => m.t === 'count').at(-1)).toEqual({ t: 'count', n: 1 });
});
```

Note: `deriveIdentity(aUid).id === aUid` (see `src/lib/cursor/identity.ts:11`), so the expected leave id is the raw `aUid`, matching the existing nav-leave test style.

- [ ] **Step 3: Run the test to verify it fails**

Run:

```bash
pnpm exec vitest run --project workers worker/durable-objects/cursor-room.test.ts -t 'reaps an abruptly-disconnected'
```

Expected: FAIL — `b` receives no `leave` (and no `count: 1`) because the base `alarm()` closes `a` without notifying presence. (The assertion on the empty/length-mismatched `leave` array fails.)

---

## Task 2: Green — generalize exclude to a Set and add the alarm reaper notify

**Files:**

- Modify: `worker/durable-objects/cursor-room.ts`

- [ ] **Step 1: Generalize the four presence helpers to a Set exclude**

Replace the helper block (`cursor-room.ts:45-82`) with the Set-based versions:

```ts
  #broadcastToPath(path: string, message: string, excludes?: ReadonlySet<WebSocket>): void {
    for (const ws of this.ctx.getWebSockets()) {
      if (excludes?.has(ws) === true) continue;
      if (this.#attachmentOf(ws).path !== path) continue;
      this.#send(ws, message);
    }
  }

  // Presence is keyed by uid (identity), NOT by socket: one visitor can hold several sockets (tabs),
  // all sharing the same IP-derived uid. Count distinct uids so multi-tab sessions count as one.
  #countOnPath(path: string, excludes?: ReadonlySet<WebSocket>): number {
    const uids = new Set<string>();
    for (const ws of this.ctx.getWebSockets()) {
      if (excludes?.has(ws) === true) continue;
      const att = this.#attachmentOf(ws);
      if (att.path === path) uids.add(att.uid);
    }

    return uids.size;
  }

  // True if a socket NOT in `excludes` for the same uid is on `path`. Used so join fires only on a
  // uid's first arrival and leave only on its last departure (otherwise closing one tab evicts the
  // visitor's cursor for everyone while another tab is still open). `excludes` is the socket(s) being
  // removed — one on a clean close, the whole dead set on a heartbeat reap.
  #hasUidOnPath(path: string, uid: string, excludes: ReadonlySet<WebSocket>): boolean {
    for (const ws of this.ctx.getWebSockets()) {
      if (excludes.has(ws)) continue;
      const att = this.#attachmentOf(ws);
      if (att.path === path && att.uid === uid) return true;
    }

    return false;
  }

  #broadcastCount(path: string, excludes?: ReadonlySet<WebSocket>): void {
    const message = JSON.stringify({ t: 'count', n: this.#countOnPath(path, excludes) } satisfies ServerMessage);
    this.#broadcastToPath(path, message, excludes);
  }
```

- [ ] **Step 2: Update `#applyPath` callers to pass `new Set([ws])`**

In `#applyPath` (currently `cursor-room.ts:87-117`), introduce a single self-exclude set and use it at the four exclude sites. Replace the body from the `const prevPath = att.path;` line through the final `this.#broadcastCount(nextPath);` with:

```ts
    const prevPath = att.path;
    if (prevPath === nextPath) return;
    const { id, color, label } = deriveIdentity(att.uid);
    const self = new Set([ws]);

    // Move this socket onto the new page first so the counts below place it correctly.
    ws.serializeAttachment({ ...att, path: nextPath } satisfies CursorAttachment);

    if (prevPath !== undefined) {
      // Leave the old page only when this uid's LAST socket leaves it (multi-tab keeps the cursor).
      if (!this.#hasUidOnPath(prevPath, att.uid, self)) {
        this.#broadcastToPath(prevPath, JSON.stringify({ t: 'leave', id } satisfies ServerMessage), self);
      }
      this.#broadcastCount(prevPath);
    }

    // Always announce arrival — peers key cursors by id, so a same-uid second tab just re-asserts the
    // same cursor (no duplicate). Suppressing it would hide same-uid tabs from each other.
    this.#broadcastToPath(nextPath, JSON.stringify({ t: 'join', id, color, label } satisfies ServerMessage), self);
    // Replay existing peers (deduped by uid) so this socket sees who's already here.
    const replayed = new Set<string>();
    for (const peer of this.ctx.getWebSockets()) {
      if (peer === ws) continue;
      const peerAtt = this.#attachmentOf(peer);
      if (peerAtt.path !== nextPath || replayed.has(peerAtt.uid)) continue;
      replayed.add(peerAtt.uid);
      const peerId = deriveIdentity(peerAtt.uid);
      this.#send(ws, JSON.stringify({ t: 'join', id: peerId.id, color: peerId.color, label: peerId.label } satisfies ServerMessage));
    }
    this.#broadcastCount(nextPath);
```

(Note: the two `#broadcastCount(prevPath)` / `#broadcastCount(nextPath)` calls keep no exclude — they intentionally count `ws` on its current page, unchanged from today.)

- [ ] **Step 3: Update `#handleMove` to pass `new Set([ws])`**

In `#handleMove` (currently `cursor-room.ts:119-125`), change the broadcast line:

```ts
    this.#broadcastToPath(path, JSON.stringify({ t: 'move', id: att.uid, x, y } satisfies ServerMessage), new Set([ws]));
```

- [ ] **Step 4: Update `webSocketClose` to pass `new Set([ws])`**

Replace `webSocketClose` (currently `cursor-room.ts:139-152`) with:

```ts
  override webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean): void {
    const att = this.#attachmentOf(ws);
    const path = att.path;
    if (path !== undefined) {
      const self = new Set([ws]);
      // Emit leave only when this uid's last socket on the page is closing (keep the cursor alive
      // while another tab of the same visitor remains).
      if (!this.#hasUidOnPath(path, att.uid, self)) {
        const { id } = deriveIdentity(att.uid);
        this.#broadcastToPath(path, JSON.stringify({ t: 'leave', id } satisfies ServerMessage), self);
      }
      this.#broadcastCount(path, self);
    }
    super.webSocketClose(ws, code, reason, wasClean);
  }
```

- [ ] **Step 5: Add the `alarm()` override and `#notifyEvicted`**

Add these two methods inside the class (e.g. directly after `webSocketClose`):

```ts
  // durabcast's base alarm() reaps sockets that stopped pinging (abrupt disconnect) by calling
  // ws.close() — which does NOT invoke our webSocketClose, so leave/count would never fire for them.
  // Notify presence for the dead set BEFORE super.alarm() closes them; super then closes + re-arms.
  override async alarm(): Promise<void> {
    const dead = new Set([...this.sessions].filter((ws) => !this.isAliveSocket(ws)));
    this.#notifyEvicted(dead);
    await super.alarm();
  }

  // Batch equivalent of webSocketClose for heartbeat-reaped sockets. The dead are still in
  // getWebSockets() here (super hasn't closed them yet), so every survivor check and count EXCLUDES
  // the dead set — making the result independent of ws.close() timing.
  #notifyEvicted(dead: ReadonlySet<WebSocket>): void {
    if (dead.size === 0) return;
    const seenLeave = new Set<string>();
    const affectedPaths = new Set<string>();
    for (const ws of dead) {
      const att = this.#attachmentOf(ws);
      const path = att.path;
      if (path === undefined) continue;
      affectedPaths.add(path);
      const key = `${path} ${att.uid}`;
      if (seenLeave.has(key)) continue;
      seenLeave.add(key);
      // Leave only when no SURVIVING socket holds the same (path, uid).
      if (this.#hasUidOnPath(path, att.uid, dead)) continue;
      const { id } = deriveIdentity(att.uid);
      this.#broadcastToPath(path, JSON.stringify({ t: 'leave', id } satisfies ServerMessage), dead);
    }
    for (const path of affectedPaths) {
      this.#broadcastCount(path, dead);
    }
  }
```

- [ ] **Step 6: Run the new test — verify it passes**

Run:

```bash
pnpm exec vitest run --project workers worker/durable-objects/cursor-room.test.ts -t 'reaps an abruptly-disconnected'
```

Expected: PASS — `b` receives `{ t: 'leave', id: aUid }` and a final `{ t: 'count', n: 1 }`.

- [ ] **Step 7: Run the whole DO test file — verify no regression**

Run:

```bash
pnpm exec vitest run --project workers worker/durable-objects/cursor-room.test.ts
```

Expected: PASS — all existing tests (join/replay/move/nav-leave/multi-tab close/count) plus the new one are green.

- [ ] **Step 8: Lint + typecheck**

Run:

```bash
pnpm lint && pnpm typecheck
```

Expected: clean. (No `let`, no wrapper coercion — `excludes?.has(ws) === true` is the explicit check; method shorthand for the `override async alarm`.)

- [ ] **Step 9: Commit**

```bash
git add worker/durable-objects/cursor-room.ts worker/durable-objects/cursor-room.test.ts
git commit -m "fix(cursor): notify leave/count when heartbeat reaps a dead socket

Abrupt disconnects (no close frame) are reaped by durabcast's base
alarm() via ws.close(), which never invokes webSocketClose — so the
leave/count broadcast was missing and the cursor lingered for peers.
Override alarm() to notify the dead set before super.alarm() closes
them; generalize the presence-exclude helpers from a single socket to
a ReadonlySet so the same last-tab predicate serves single close and
batch reap.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Edge coverage — surviving same-uid tab, and no-op when none dead

**Files:**

- Modify: `worker/durable-objects/cursor-room.test.ts`

- [ ] **Step 1: Add the "one tab of a uid dies, another survives → no leave" test**

Inside `describe('CursorRoom', ...)`, add:

```ts
it('keeps the visitor present when only one of their tabs is reaped (same uid survives)', async () => {
  const room = 'reap-multitab';
  const sharedUid = 'cccc3333cccc3333';
  const peerUid = 'dddd4444dddd4444';

  const tab1 = await connect(room, sharedUid);
  const tab2 = await connect(room, sharedUid);
  const peer = await connect(room, peerUid);
  nav(tab1, '/x');
  nav(tab2, '/x');
  nav(peer, '/x');
  await settle();

  const peerSeen: string[] = [];
  peer.addEventListener('message', (e) => peerSeen.push(`${e.data}`));

  // Kill exactly ONE of the shared-uid tabs, then reap.
  await killByUid(room, sharedUid, 1);
  await runDurableObjectAlarm(stubFor(room));
  await settle();

  const parsed = peerSeen.map((s) => JSON.parse(s));
  expect(parsed.filter((m) => m.t === 'leave')).toHaveLength(0); // visitor still present via the other tab
  expect(parsed.filter((m) => m.t === 'count').at(-1) ?? { t: 'count', n: 2 }).toEqual({ t: 'count', n: 2 });
});
```

- [ ] **Step 2: Add the "no dead sockets → no leave/count emitted" regression test**

```ts
it('emits nothing when the alarm runs with no dead sockets', async () => {
  const room = 'reap-none';
  const aUid = 'eeee5555eeee5555';
  const bUid = 'ffff6666ffff6666';

  const a = await connect(room, aUid);
  const b = await connect(room, bUid);
  nav(a, '/x');
  nav(b, '/x');
  await settle();

  const bSeen: string[] = [];
  b.addEventListener('message', (e) => bSeen.push(`${e.data}`));

  // Both sockets are alive (just connected) — the reaper must not touch them.
  await runDurableObjectAlarm(stubFor(room));
  await settle();

  const parsed = bSeen.map((s) => JSON.parse(s));
  expect(parsed.filter((m) => m.t === 'leave')).toHaveLength(0);
  expect(parsed.filter((m) => m.t === 'count')).toHaveLength(0);
});
```

- [ ] **Step 3: Run the DO test file — verify all pass**

Run:

```bash
pnpm exec vitest run --project workers worker/durable-objects/cursor-room.test.ts
```

Expected: PASS — both new edge tests green alongside the rest.

- [ ] **Step 4: Lint + typecheck**

Run:

```bash
pnpm lint && pnpm typecheck
```

Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add worker/durable-objects/cursor-room.test.ts
git commit -m "test(cursor): cover same-uid survivor and no-dead reaper cases

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Final verification

- [ ] **Run the full workers project once more**

```bash
pnpm exec vitest run --project workers
```

Expected: PASS.

- [ ] **Confirm scope:** only `worker/durable-objects/cursor-room.ts` and its test changed; no client (`src/lib/cursor/visitor-pointer-app.ts`), cadence, or durabcast changes. `git status` shows the working-tree `CLAUDE.md` change untouched and not staged.

## Notes / gotchas for the implementer

- **`deserializeAttachment()` is `any`** in the test helper — `att.uid` / `att.connectedAt` access is fine without assertions (the existing tests access `JSON.parse(...)` results the same way).
- **`runDurableObjectAlarm` returns `false` if no alarm is scheduled.** The base `createRoom` schedules one on the first connection, so it will run; you can ignore the return value (or `expect(await runDurableObjectAlarm(...)).toBe(true)` if you want an extra guard).
- **Do not call `super.alarm()` before notifying** — once it closes the dead sockets you lose their attachments and the dead-set exclusion logic. Notify first, then `await super.alarm()`.
- **`this.sessions`** (protected) and **`isAliveSocket`** (public) come from durabcast's `BroadcastMessage`; both are accessible from the subclass. Compute `dead` from `this.sessions` (the base reaps from the same Set) so the override and `super.alarm()` agree on which sockets are dead.
- **No `let`, no `forEach`, no wrapper coercion** (project lint rules). Use `.filter`, `for...of`, and explicit `=== true` / `=== undefined` comparisons.
