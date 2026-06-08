# Cursor Presence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 同じページを開いている閲覧者のカーソルを、Cloudflare Durable Objects + WebSocket でリアルタイム共有し、SysBar に人数を出す。

**Architecture:** Worker の Hono ルート（`defineWebSocketHelper` で `$ws` 型を付与）が WebSocket upgrade を durabcast の `CursorRoom` DO へ forward。DO が socket を保持し identity/presence を broadcast。ブラウザは Hono RPC `hc` の `$ws` に `reconnecting-websocket` を注入して接続し、`'use client'` の island が他者カーソルを CSS transition で描画する。

**Tech Stack:** Hono 4.12（RPC / `defineWebSocketHelper`）, durabcast（`BroadcastMessage`）, reconnecting-websocket, zod, Panda CSS, react-aria-components, vitest（unit / browser / workers pool）。

Spec: `docs/superpowers/specs/2026-06-06-cursor-presence-design.md`

---

## File Structure

```
worker/
  routes/cursors.ts                 ← Hono route + defineWebSocketHelper forward, CursorAppType 輸出
  durable-objects/cursor-room.ts    ← CursorRoom extends BroadcastMessage（presence override）
  durable-objects/cursor-room.test.ts ← workers pool test
  worker.ts                         ← cursorRoutes 登録（mount 前）+ CursorRoom export
src/
  lib/cursor/
    protocol.ts        ← zod schema + message 型（client/server 共有）
    protocol.test.ts
    coordinate.ts      ← toNormalized / fromNormalized 純関数
    coordinate.test.ts
    identity.ts        ← hashIp(async) / deriveIdentity(pure) / CURSOR_COLORS
    identity.test.ts
  components/cursor-presence/
    presence-context.ts   ← { count, enabled, toggle } context
    use-cursor-socket.ts  ← hc + RWS 接続/送受信/ping
    cursor-layer.tsx      ← fixed overlay（ref Map + CSS transition + "+N more"）
    index.tsx             ← 'use client' island + PresenceProvider
    styles.css.ts
    cursor-presence.test.tsx
  components/sys-bar/
    index.tsx           ← `watching N` + toggle（PresenceContext 購読）— Modify
    styles.css.ts       ← watching/toggle スタイル追加 — Modify
  components/site-shell/
    index.tsx           ← PresenceProvider で包む + CursorPresence mount + data-cursor-surface — Modify
  themes/tokens/index.ts ← colors.cursor パレット追加 — Modify
wrangler.toml            ← CURSOR_ROOM binding + migration v2 + CURSOR_SALT var — Modify
tsconfig.json            ← paths に @worker/* 追加 — Modify
```

---

## Phase 0: Baseline typecheck 修復

> fresh worktree で `wrangler types`(4.98) が binding を optional 化し、`payload.config.ts` と
> images handler が既存エラーになる。cursor とは無関係だが husky(pre-commit typecheck) を通すため先に緑化する。

### Task 0.1: payload.config.ts の binding を guard

**Files:**

- Modify: `src/payload.config.ts`（`cfEnv` 解決直後〜`db`/`r2Storage` 使用箇所）

- [ ] **Step 1: 現状エラーを確認**

Run: `pnpm typecheck`
Expected: `src/payload.config.ts(107,5)` D1Database | undefined, `(113,7)` R2Bucket | undefined, `worker/handlers/images/index.ts(28,27)` images possibly undefined の3件。

- [ ] **Step 2: `cfEnv` から D1/R2 を const 抽出し guard**

`cfEnv` を確定している箇所（`const cfEnv = ...` の直後、`buildConfig({...})` の前）に追加：

```ts
const d1 = cfEnv.D1;
const r2 = cfEnv.R2;
if (d1 === undefined || r2 === undefined) {
  throw new Error('Cloudflare bindings D1/R2 are not available in this context');
}
```

`db` と `r2Storage` の参照を差し替え：

```ts
  db: sqliteD1Adapter({
    binding: d1,
    migrationDir: path.resolve(dirname, '..', 'migrations'),
    push: false,
  }),
  plugins: [
    r2Storage({
      bucket: r2,
```

- [ ] **Step 3: typecheck で payload.config.ts エラー消失を確認**

Run: `pnpm typecheck`
Expected: payload.config.ts の 2 件が消え、残るは images の 1 件のみ。

### Task 0.2: images handler の IMAGES を guard

**Files:**

- Modify: `worker/handlers/images/index.ts`（`transformImage` 引数型 と 呼び出し箇所 87 行付近）

- [ ] **Step 1: `transformImage` の引数型を NonNullable に**

```ts
const transformImage = async (images: NonNullable<Cloudflare.Env['IMAGES']>, body: ReadableStream<Uint8Array>, query: TransformOptionsType, accept: string) => {
```

- [ ] **Step 2: 呼び出し前に guard**

`imageHandlers` の末尾 `return transformImage(c.env.IMAGES, body, query, accept);` を差し替え：

```ts
  const images = c.env.IMAGES;
  if (images === undefined) return c.json({ error: 'IMAGES binding unavailable' }, 500);

  return transformImage(images, body, query, accept);
```

- [ ] **Step 3: typecheck 緑を確認**

Run: `pnpm typecheck`
Expected: エラー 0 件で終了（exit 0）。

- [ ] **Step 4: lint**

Run: `pnpm lint`
Expected: 通過。

- [ ] **Step 5: Commit**

```bash
git add src/payload.config.ts worker/handlers/images/index.ts docs/superpowers/specs/2026-06-06-cursor-presence-design.md docs/superpowers/plans/2026-06-06-cursor-presence.md
git commit -m "chore: green baseline typecheck + add cursor-presence spec/plan"
```

---

## Phase 1: 依存追加 + 純粋コア（protocol / coordinate / identity）

### Task 1.1: 依存パッケージ追加

**Files:** `package.json`（pnpm 管理）

- [ ] **Step 1: install**

```bash
pnpm add durabcast reconnecting-websocket
```

- [ ] **Step 2: 取得確認**

Run: `node -e "console.log(require('./package.json').dependencies['durabcast'], require('./package.json').dependencies['reconnecting-websocket'])"`
Expected: 両バージョンが表示される。

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add durabcast and reconnecting-websocket"
```

### Task 1.2: coordinate.ts（純関数）

**Files:**

- Create: `src/lib/cursor/coordinate.ts`
- Test: `src/lib/cursor/coordinate.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';

import { fromNormalized, toNormalized } from './coordinate';

const wide = { left: 100, top: 0, width: 800, height: 2000 };
const narrow = { left: 20, top: 0, width: 320, height: 4000 };

describe('coordinate', () => {
  it('normalizes a point relative to the surface bbox', () => {
    expect(toNormalized(wide, 500, 1000)).toEqual({ nx: 0.5, ny: 0.5 });
  });

  it('round-trips through a different rect preserving relative position', () => {
    const n = toNormalized(wide, 500, 1000);
    expect(fromNormalized(narrow, n)).toEqual({ x: 20 + 0.5 * 320, y: 0.5 * 4000 });
  });

  it('allows out-of-column overshoot (no clamping)', () => {
    expect(toNormalized(wide, 100 - 80, 0).nx).toBeCloseTo(-0.1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run --project unit src/lib/cursor/coordinate.test.ts`
Expected: FAIL（module not found / export なし）。

- [ ] **Step 3: Write minimal implementation**

```ts
export type Rect = { left: number; top: number; width: number; height: number };
export type Norm = { nx: number; ny: number };
export type Point = { x: number; y: number };

export const toNormalized = (rect: Rect, pageX: number, pageY: number): Norm => ({
  nx: (pageX - rect.left) / rect.width,
  ny: (pageY - rect.top) / rect.height,
});

export const fromNormalized = (rect: Rect, n: Norm): Point => ({
  x: rect.left + n.nx * rect.width,
  y: rect.top + n.ny * rect.height,
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run --project unit src/lib/cursor/coordinate.test.ts`
Expected: PASS（3 tests）。

- [ ] **Step 5: Commit**

```bash
git add src/lib/cursor/coordinate.ts src/lib/cursor/coordinate.test.ts
git commit -m "feat(cursor): normalized coordinate pure functions"
```

### Task 1.3: identity.ts（hashIp async + deriveIdentity pure）

**Files:**

- Create: `src/lib/cursor/identity.ts`
- Test: `src/lib/cursor/identity.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';

import { CURSOR_COLORS, deriveIdentity, hashIp } from './identity';

describe('identity', () => {
  it('derives a stable label and a palette color from a uid', () => {
    const a = deriveIdentity('a3f29b10c4d5e6f7');
    expect(a.label).toBe('#a3f2');
    expect(CURSOR_COLORS).toContain(a.color);
    expect(deriveIdentity('a3f29b10c4d5e6f7')).toEqual(a); // deterministic
  });

  it('hashIp is deterministic for same ip+salt and differs across ips', async () => {
    const u1 = await hashIp('203.0.113.5', 'salt');
    const u2 = await hashIp('203.0.113.5', 'salt');
    const u3 = await hashIp('203.0.113.9', 'salt');
    expect(u1).toBe(u2);
    expect(u1).not.toBe(u3);
    expect(u1).toHaveLength(16);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run --project unit src/lib/cursor/identity.test.ts`
Expected: FAIL（export なし）。

- [ ] **Step 3: Write minimal implementation**

```ts
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
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
};
```

> 注: `CURSOR_COLORS[0]` は `'blue'`（fallback）。`parseInt` は radix 16 を明示（hex 解釈）。

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run --project unit src/lib/cursor/identity.test.ts`
Expected: PASS（2 tests）。

- [ ] **Step 5: Commit**

```bash
git add src/lib/cursor/identity.ts src/lib/cursor/identity.test.ts
git commit -m "feat(cursor): identity derivation (ip hash + palette/label)"
```

### Task 1.4: protocol.ts（zod schema + 型）

**Files:**

- Create: `src/lib/cursor/protocol.ts`
- Test: `src/lib/cursor/protocol.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';

import { ClientMessage, ServerMessage } from './protocol';

describe('protocol', () => {
  it('accepts a valid move command', () => {
    expect(ClientMessage.safeParse({ t: 'move', nx: 0.5, ny: 0.2 }).success).toBe(true);
  });

  it('rejects unknown command / missing fields', () => {
    expect(ClientMessage.safeParse({ t: 'jump', nx: 0, ny: 0 }).success).toBe(false);
    expect(ClientMessage.safeParse({ t: 'move', nx: 0.5 }).success).toBe(false);
  });

  it('parses server messages by discriminator', () => {
    expect(ServerMessage.safeParse({ t: 'count', n: 3 }).success).toBe(true);
    expect(ServerMessage.safeParse({ t: 'move', id: 'x', nx: 0.1, ny: 0.2 }).success).toBe(true);
    expect(ServerMessage.safeParse({ t: 'welcome', self: { id: 'x', color: 'blue', label: '#x' } }).success).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run --project unit src/lib/cursor/protocol.test.ts`
Expected: FAIL。

- [ ] **Step 3: Write minimal implementation**

```ts
import { z } from 'zod';

import { CURSOR_COLORS } from './identity';

const Color = z.enum(CURSOR_COLORS);
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run --project unit src/lib/cursor/protocol.test.ts`
Expected: PASS（3 tests）。

- [ ] **Step 5: Commit**

```bash
git add src/lib/cursor/protocol.ts src/lib/cursor/protocol.test.ts
git commit -m "feat(cursor): websocket message protocol (zod)"
```

---

## Phase 2: cursor.palette token

### Task 2.1: colors.cursor を tokens に追加

**Files:**

- Modify: `src/themes/tokens/index.ts`（`colors` 直下、`red` の後）

- [ ] **Step 1: パレット追加**

`colors` オブジェクトの `red: {...},` の直後に追加（全色 L≈0.50・白文字で WCAG AA を満たす想定）：

```ts
    cursor: {
      blue: { value: 'oklch(0.490 0.287 266)' },
      red: { value: 'oklch(0.560 0.230 25)' },
      violet: { value: 'oklch(0.500 0.250 305)' },
      teal: { value: 'oklch(0.520 0.130 195)' },
      magenta: { value: 'oklch(0.540 0.250 340)' },
      green: { value: 'oklch(0.520 0.170 150)' },
    },
```

- [ ] **Step 2: panda codegen + 型確認**

Run: `pnpm prepare && pnpm typecheck`
Expected: codegen 成功、typecheck 緑。`styled-system/tokens` に `colors.cursor.*` が出る。

- [ ] **Step 3: WCAG コントラスト確認（手動）**

各 `colors.cursor.*`（背景）に対し前景 `colors.white` の contrast ratio ≥ 4.5（小文字テキスト AA）であることを確認。満たさない色は L を 0.02 刻みで下げて再 codegen。
（確認は `pnpm dev` で `#hash` ピルを目視 + DevTools。Phase 5 の a11y チェックでも再検証。）

- [ ] **Step 4: Commit**

```bash
git add src/themes/tokens/index.ts styled-system
git commit -m "feat(tokens): cursor palette (6 accessible hues)"
```

---

## Phase 3: Durable Object + Worker route + migration

### Task 3.1: CursorRoom DO

**Files:**

- Create: `worker/durable-objects/cursor-room.ts`

> durabcast `BroadcastMessage` を継承。`createRoom` を override して server socket 参照を握り、
> `deriveIdentity(uid)` で welcome/join/count を broadcast。`webSocketMessage` で move を中継、
> `webSocketClose` で leave/count。hibernation・ping/pong・alarm は基底を再利用。

- [ ] **Step 1: 実装**

```ts
import { BroadcastMessage } from 'durabcast';

import { deriveIdentity } from '../../src/lib/cursor/identity';
import { ClientMessage, type ServerMessage } from '../../src/lib/cursor/protocol';

import type { Env } from 'hono';

type CursorBindings = { Bindings: Cloudflare.Env };

const send = (ws: WebSocket, msg: ServerMessage): void => ws.send(JSON.stringify(msg));

export class CursorRoom extends BroadcastMessage<CursorBindings & Env> {
  protected count(): number {
    return this.ctx.getWebSockets().length;
  }

  protected broadcastCount(delta = 0): void {
    this.broadcast(JSON.stringify({ t: 'count', n: this.count() + delta } satisfies ServerMessage));
  }

  // override: durabcast createRoom + presence broadcast（server socket を握る必要があるため再実装）
  protected async createRoom(roomId: string, uid: string): Promise<WebSocket> {
    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];

    this.ctx.acceptWebSocket(server);
    this.sessions.add(server);
    server.serializeAttachment({ roomId, uid, connectedAt: new Date() });

    const self = deriveIdentity(uid);
    send(server, { t: 'welcome', self });
    this.broadcast(JSON.stringify({ t: 'join', ...self } satisfies ServerMessage), { excludes: [server] });
    this.broadcastCount();

    if (this.AUTO_CLOSE) {
      const alarm = await this.ctx.storage.getAlarm();
      if (alarm === null) await this.ctx.storage.setAlarm(Date.now() + this.INTERVAL);
    }

    return client;
  }

  override webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): void {
    if (typeof message !== 'string') return;
    if (message === this.REQUEST_RESPONSE_PAIR.request) return; // ping は auto-response 済

    const parsed = ClientMessage.safeParse(JSON.parse(message));
    if (!parsed.success) {
      console.warn('[cursor] invalid client message', parsed.error.message);
      return;
    }

    const attachment: { uid: string } = ws.deserializeAttachment();
    this.broadcast(
      JSON.stringify({ t: 'move', id: attachment.uid, nx: parsed.data.nx, ny: parsed.data.ny } satisfies ServerMessage),
      { excludes: [ws] },
    );
  }

  override webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean): void {
    const attachment: { uid: string } = ws.deserializeAttachment();
    this.sessions.delete(ws);
    this.broadcast(JSON.stringify({ t: 'leave', id: attachment.uid } satisfies ServerMessage), { excludes: [ws] });
    this.broadcastCount(-1); // 閉じる socket はまだ getWebSockets に含まれ得るため -1
  }
}
```

> 検証ポイント: `deriveIdentity`/`protocol` を `src/lib/cursor` から相対 import する。worker tsconfig は
> `src` を解決できる必要がある（できなければ `worker/tsconfig.json` の include に `../src/lib/cursor` を足す）。

### Task 3.2: Worker route（forward + $ws 型輸出）

**Files:**

- Create: `worker/routes/cursors.ts`

- [ ] **Step 1: 実装**

```ts
import { Hono } from 'hono';
import { defineWebSocketHelper } from 'hono/helper/websocket';

import { hashIp } from '../../src/lib/cursor/identity';

type CursorEnv = { Bindings: Cloudflare.Env };

const upgradeToRoom = defineWebSocketHelper<unknown, never>(async (c) => {
  if (c.req.header('Upgrade') !== 'websocket') return;

  const room = c.req.param('room');
  const ip = c.req.header('cf-connecting-ip') ?? 'anon';
  const uid = await hashIp(ip, c.env.CURSOR_SALT ?? 'dev-salt');

  const stub = c.env.CURSOR_ROOM.get(c.env.CURSOR_ROOM.idFromName(room));
  const doUrl = new URL(`/rooms/${encodeURIComponent(room)}`, 'https://cursor.do');
  doUrl.searchParams.set('uid', uid);

  return stub.fetch(new Request(doUrl, c.req.raw));
});

export const cursorRoutes = new Hono<CursorEnv>()
  .get('/api/cursors/:room', upgradeToRoom((_c) => ({})));

export type CursorAppType = typeof cursorRoutes;
```

> `CURSOR_SALT` / `CURSOR_ROOM` は wrangler.toml で定義（Task 3.4）→ `pnpm cf:types` で型に反映。

### Task 3.3: worker.ts に登録 + DO export

**Files:**

- Modify: `worker/worker.ts`

- [ ] **Step 1: import 追加**

ファイル先頭の import 群に追加：

```ts
import { cursorRoutes } from './routes/cursors';
```

- [ ] **Step 2: opennext mount の前に route 登録**

`app.mount('/', handler.fetch ...)` の **直前** に追加：

```ts
app.route('/', cursorRoutes);
```

- [ ] **Step 3: DO を re-export**

末尾の `export { DOQueueHandler } ...` の下に追加：

```ts
export { CursorRoom } from './durable-objects/cursor-room';
```

### Task 3.4: wrangler.toml（binding + migration + salt）

**Files:**

- Modify: `wrangler.toml`

- [ ] **Step 1: top-level に追加**

`[vars]` セクションに：

```toml
CURSOR_SALT = "dev-cursor-salt-change-me"
```

`[[durable_objects.bindings]]`（既存 `NEXT_CACHE_DO_QUEUE` の隣）に追加：

```toml
[[durable_objects.bindings]]
name = "CURSOR_ROOM"
class_name = "CursorRoom"
```

migration を追記（既存 `tag = "v1"` の下）：

```toml
[[migrations]]
tag = "v2"
new_sqlite_classes = ["CursorRoom"]
```

- [ ] **Step 2: staging / production env にも binding 追加**

`[[env.staging.durable_objects.bindings]]` と `[[env.production.durable_objects.bindings]]` に同じ `CURSOR_ROOM`/`CursorRoom` ブロックを追加。各 env の `[env.*.vars]` に `CURSOR_SALT` も追加（本番は後で `wrangler secret put CURSOR_SALT` に置換可）。

- [ ] **Step 3: test env にも DO binding を追加**

`[env.test]` セクション（workers pool 用）に追加：

```toml
[[env.test.durable_objects.bindings]]
name = "CURSOR_ROOM"
class_name = "CursorRoom"
```

- [ ] **Step 4: 型再生成 + typecheck**

Run: `pnpm cf:types && pnpm typecheck`
Expected: `Cloudflare.Env` に `CURSOR_ROOM` / `CURSOR_SALT` が出て、worker route/DO が型通過。

### Task 3.5: CursorRoom workers-pool テスト

**Files:**

- Create: `worker/durable-objects/cursor-room.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { env, runInDurableObject } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';

import { deriveIdentity } from '../../src/lib/cursor/identity';

import type { CursorRoom } from './cursor-room';

const connect = async (room: string, uid: string): Promise<WebSocket> => {
  const stub = env.CURSOR_ROOM.get(env.CURSOR_ROOM.idFromName(room));
  const url = new URL(`/rooms/${room}`, 'https://cursor.do');
  url.searchParams.set('uid', uid);
  const res = await stub.fetch(new Request(url, { headers: { Upgrade: 'websocket' } }));
  const ws = res.webSocket;
  if (!ws) throw new Error('no webSocket on response');
  ws.accept();
  return ws;
};

const nextMessage = (ws: WebSocket): Promise<string> =>
  new Promise((resolve) => ws.addEventListener('message', (e) => resolve(`${e.data}`), { once: true }));

describe('CursorRoom', () => {
  it('sends welcome with derived identity on connect', async () => {
    const ws = await connect('p1', 'a3f29b10c4d5e6f7');
    const msg = JSON.parse(await nextMessage(ws));
    expect(msg.t).toBe('welcome');
    expect(msg.self).toEqual(deriveIdentity('a3f29b10c4d5e6f7'));
  });

  it('broadcasts move to others but not back to sender', async () => {
    const a = await connect('p2', 'aaaa1111bbbb2222');
    const b = await connect('p2', 'cccc3333dddd4444');
    // drain welcome/join/count noise on b, then send move from a
    a.send(JSON.stringify({ t: 'move', nx: 0.3, ny: 0.7 }));
    const seen: string[] = [];
    b.addEventListener('message', (e) => seen.push(`${e.data}`));
    await new Promise((r) => setTimeout(r, 50));
    const moves = seen.map((s) => JSON.parse(s)).filter((m) => m.t === 'move');
    expect(moves.at(-1)).toMatchObject({ t: 'move', id: 'aaaa1111bbbb2222', nx: 0.3, ny: 0.7 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run --project workers worker/durable-objects/cursor-room.test.ts`
Expected: FAIL（CursorRoom 未 export / binding 未設定なら設定漏れを修正）。

- [ ] **Step 3: 実装は Task 3.1〜3.4 で済。テストを通す**

必要なら Task 3.1 の `webSocketClose` count 計算・`createRoom` の broadcast 順序を調整。

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run --project workers worker/durable-objects/cursor-room.test.ts`
Expected: PASS（2 tests）。

- [ ] **Step 5: lint + typecheck + commit**

```bash
pnpm lint && pnpm typecheck
git add worker/ wrangler.toml cloudflare-env.d.ts
git commit -m "feat(cursor): CursorRoom durable object + worker ws route"
```

> `cloudflare-env.d.ts` は gitignore 対象。`git add` で無視されるなら commit 不要（生成物）。

---

## Phase 4: Client island（context / socket / layer）

### Task 4.1: tsconfig に @worker/\* alias

**Files:**

- Modify: `tsconfig.json`（`paths`）

- [ ] **Step 1: alias 追加**

`paths` に追加：

```json
      "@worker/*": ["./worker/*"],
```

- [ ] **Step 2: typecheck（worker 型が src から解決できるか）**

Run: `pnpm typecheck`
Expected: 緑。`import type { CursorAppType } from '@worker/routes/cursors'` が解決できる状態。

### Task 4.2: presence-context.ts

**Files:**

- Create: `src/components/cursor-presence/presence-context.ts`

- [ ] **Step 1: 実装**

```ts
'use client';

import { createContext, useContext } from 'react';

export type PresenceValue = {
  count: number;
  enabled: boolean;
  toggle: () => void;
};

const PresenceContext = createContext<PresenceValue | null>(null);

export const PresenceContextProvider = PresenceContext.Provider;

export const usePresence = (): PresenceValue => {
  const value = useContext(PresenceContext);
  if (value === null) return { count: 0, enabled: true, toggle: () => undefined };

  return value;
};
```

> SysBar が island 外でも安全に購読できるよう、未 Provider 時は無害な既定値を返す。

### Task 4.3: use-cursor-socket.ts

**Files:**

- Create: `src/components/cursor-presence/use-cursor-socket.ts`

- [ ] **Step 1: 実装**

```ts
'use client';

import { hc } from 'hono/client';
import { useEffect, useRef, useState } from 'react';
import ReconnectingWebSocket from 'reconnecting-websocket';

import { ServerMessage, type ClientMessage } from '@lib/cursor/protocol';

import type { CursorAppType } from '@worker/routes/cursors';

type Handlers = {
  onMessage: (msg: ServerMessage) => void;
};

export type CursorSocket = {
  send: (msg: ClientMessage) => void;
};

export const useCursorSocket = (room: string, enabled: boolean, handlers: Handlers): CursorSocket => {
  const onMessage = useRef(handlers.onMessage);
  onMessage.current = handlers.onMessage;
  const socketRef = useRef<WebSocket | null>(null);
  const [, setReady] = useState(false);

  useEffect(() => {
    const client = hc<CursorAppType>(location.origin, {
      webSocket: (url, protocols) =>
        new ReconnectingWebSocket(url, protocols, { maxEnqueuedMessages: 0 }) as unknown as WebSocket,
    });
    const ws = client.api.cursors[':room'].$ws({ param: { room } });
    socketRef.current = ws;

    const ping = setInterval(() => ws.readyState === ws.OPEN && ws.send('ping'), 30_000);

    const handleMessage = (event: MessageEvent): void => {
      if (event.data === 'pong') return;
      const parsed = ServerMessage.safeParse(JSON.parse(`${event.data}`));
      if (!parsed.success) {
        console.warn('[cursor] invalid server message', parsed.error.message);
        return;
      }
      onMessage.current(parsed.data);
    };

    ws.addEventListener('open', () => setReady(true));
    ws.addEventListener('message', handleMessage);

    return () => {
      clearInterval(ping);
      ws.removeEventListener('message', handleMessage);
      ws.close();
      socketRef.current = null;
    };
  }, [room]);

  return {
    send: (msg) => {
      const ws = socketRef.current;
      if (enabled && ws && ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg));
    },
  };
};
```

> `@lib/*` alias は未定義なら tsconfig に `"@lib/*": ["./src/lib/*"]` を追加（Task 4.1 と同時でも可）。
> ping は durabcast 既定 `request:'ping'` に合わせた素朴実装（reconnecting-websocket が再接続を担当）。

### Task 4.4: cursor-layer.tsx（imperative 描画）

**Files:**

- Create: `src/components/cursor-presence/cursor-layer.tsx`
- Create: `src/components/cursor-presence/styles.css.ts`

- [ ] **Step 1: styles.css.ts**

```ts
import { css } from '@styled/css';

export const layer = css({
  position: 'fixed',
  inset: '0',
  pointerEvents: 'none',
  zIndex: '50',
  overflow: 'hidden',
});

export const cursor = css({
  position: 'absolute',
  top: '0',
  left: '0',
  display: 'flex',
  alignItems: 'center',
  gap: '[2px]',
  fontFamily: 'mono',
  fontSize: 'xs',
  whiteSpace: 'nowrap',
  transition: 'translate 100ms linear',
  '@media (prefers-reduced-motion: reduce)': {
    transition: 'none',
  },
});

export const glyph = css({ fontSize: '[16px]', fontWeight: 'bold', lineHeight: '1' });

export const label = css({
  paddingInline: '[4px]',
  color: 'white',
});

export const more = css({
  position: 'absolute',
  right: 'element',
  bottom: 'element',
  fontFamily: 'mono',
  fontSize: 'xs',
  color: 'fg.muted',
});
```

- [ ] **Step 2: cursor-layer.tsx**

```tsx
'use client';

import { useEffect, useRef } from 'react';

import { fromNormalized, type Rect } from '@lib/cursor/coordinate';
import { type CursorColor } from '@lib/cursor/identity';

import * as styles from './styles.css';

const MAX_RENDERED = 30;
const colorVar = (color: CursorColor): string => `var(--colors-cursor-${color})`;

export type RemoteCursor = { id: string; color: CursorColor; label: string };

type Props = {
  getRect: () => Rect | null;
  registerMove: (apply: (id: string, nx: number, ny: number) => void) => void;
  registerPresence: (apply: (cursors: RemoteCursor[]) => void) => void;
};

export const CursorLayer = ({ getRect, registerMove, registerPresence }: Props) => {
  const layerRef = useRef<HTMLDivElement>(null);
  const nodes = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    registerMove((id, nx, ny) => {
      const node = nodes.current.get(id);
      const rect = getRect();
      if (!node || !rect) return;
      const p = fromNormalized(rect, { nx, ny });
      node.style.translate = `${p.x}px ${p.y}px`;
    });

    registerPresence((cursors) => {
      const layer = layerRef.current;
      if (!layer) return;
      const visible = cursors.slice(0, MAX_RENDERED);
      const keep = new Set(visible.map((c) => c.id));

      for (const [id, node] of nodes.current) {
        if (!keep.has(id)) {
          node.remove();
          nodes.current.delete(id);
        }
      }
      for (const c of visible) {
        if (nodes.current.has(c.id)) continue;
        const node = document.createElement('div');
        node.className = styles.cursor;
        node.innerHTML = `<span class="${styles.glyph}" style="color:${colorVar(c.color)}">✕</span><span class="${styles.label}" style="background:${colorVar(c.color)}">${c.label}</span>`;
        layer.appendChild(node);
        nodes.current.set(c.id, node);
      }

      const moreNode = layer.querySelector<HTMLDivElement>('[data-more]');
      const overflow = cursors.length - visible.length;
      if (overflow > 0) {
        const el = moreNode ?? Object.assign(document.createElement('div'), { className: styles.more });
        el.dataset.more = 'true';
        el.textContent = `+${overflow} more`;
        if (!moreNode) layer.appendChild(el);
      } else if (moreNode) {
        moreNode.remove();
      }
    });
  }, [getRect, registerMove, registerPresence]);

  return <div ref={layerRef} className={styles.layer} aria-hidden="true" />;
};
```

> `innerHTML` は自前生成の固定文字列 + サニタイズ済みデータ（label は `#`+hex、color は enum）のみ。
> 外部入力を直接挿入しないため XSS 面は限定的だが、レビュー時に label/color が enum/hex に限定されることを確認。

### Task 4.5: index.tsx（island + provider 統合）

**Files:**

- Create: `src/components/cursor-presence/index.tsx`

- [ ] **Step 1: 実装**

```tsx
'use client';

import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { toNormalized, type Rect } from '@lib/cursor/coordinate';
import { PresenceContextProvider } from './presence-context';
import { CursorLayer, type RemoteCursor } from './cursor-layer';
import { useCursorSocket } from './use-cursor-socket';

const STORAGE_KEY = 'cursor-presence-enabled';
const SURFACE_SELECTOR = '[data-cursor-surface]';

const readRect = (): Rect | null => {
  const el = document.querySelector(SURFACE_SELECTOR);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { left: r.left + window.scrollX, top: r.top + window.scrollY, width: r.width, height: r.height };
};

export const CursorPresence = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const [enabled, setEnabled] = useState(true);
  const [count, setCount] = useState(0);

  const cursors = useRef<Map<string, RemoteCursor>>(new Map());
  const moveApply = useRef<(id: string, nx: number, ny: number) => void>(() => undefined);
  const presenceApply = useRef<(list: RemoteCursor[]) => void>(() => undefined);
  const rectRef = useRef<Rect | null>(null);

  const syncPresence = useCallback(() => {
    if (enabled) presenceApply.current([...cursors.current.values()]);
    else presenceApply.current([]);
  }, [enabled]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'false') setEnabled(false);
  }, []);

  useEffect(() => {
    const update = (): void => {
      rectRef.current = readRect();
    };
    update();
    const observer = new ResizeObserver(update);
    const el = document.querySelector(SURFACE_SELECTOR);
    if (el) observer.observe(el);
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [pathname]);

  const socket = useCursorSocket(pathname, enabled, {
    onMessage: (msg) => {
      switch (msg.t) {
        case 'welcome':
          break;
        case 'join':
          cursors.current.set(msg.id, { id: msg.id, color: msg.color, label: msg.label });
          syncPresence();
          break;
        case 'move':
          moveApply.current(msg.id, msg.nx, msg.ny);
          break;
        case 'leave':
          cursors.current.delete(msg.id);
          syncPresence();
          break;
        case 'count':
          setCount(msg.n);
          break;
      }
    },
  });

  useEffect(() => {
    if (!matchMedia('(pointer:fine)').matches) return;
    const handle = (e: PointerEvent): void => {
      const rect = rectRef.current;
      if (!rect) return;
      const n = toNormalized(rect, e.pageX, e.pageY);
      socket.send({ t: 'move', nx: n.nx, ny: n.ny });
    };
    let raf = 0;
    const onMove = (e: PointerEvent): void => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        handle(e);
      });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [socket]);

  useEffect(() => {
    syncPresence();
  }, [syncPresence]);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, `${next}`);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ count, enabled, toggle }), [count, enabled, toggle]);

  return (
    <PresenceContextProvider value={value}>
      {children}
      <CursorLayer
        getRect={() => rectRef.current}
        registerMove={(apply) => {
          moveApply.current = apply;
        }}
        registerPresence={(apply) => {
          presenceApply.current = apply;
        }}
      />
    </PresenceContextProvider>
  );
};
```

> `let raf` は eslint(functional) で禁止の `let` に当たるため、`raf` を `useRef<number>(0)` に置換して実装する
> （このコードはレビュー時に const 化／ref 化する。下の Step 2 で確認）。

- [ ] **Step 2: `let` 撤去（ref 化）**

`let raf = 0;` を削除し、`const rafRef = useRef(0);` を effect 外で宣言、`raf` 参照を `rafRef.current` に置換。

- [ ] **Step 3: lint + typecheck**

Run: `pnpm lint && pnpm typecheck`
Expected: 緑（`let`/`forEach`/`!` 不使用、arrow function）。

- [ ] **Step 4: Commit**

```bash
git add src/components/cursor-presence tsconfig.json
git commit -m "feat(cursor): client island (socket, layer, presence context)"
```

---

## Phase 5: SysBar + SiteShell 結線 + browser test

### Task 5.1: SiteShell に Provider + island + surface

**Files:**

- Modify: `src/components/site-shell/index.tsx`
- Modify: `src/components/site-shell/styles.css`（`stage` に `data-cursor-surface` を付ける場合は不要、属性は JSX 側）

- [ ] **Step 1: CursorPresence で stage を包み、surface 属性を付与**

```tsx
import { CursorPresence } from '@components/cursor-presence';
// ...
export const SiteShell = ({ children }: { children: ReactNode }) => {
  return (
    <LifeEngineProvider>
      <CursorPresence>
        <TypographyBand />
        <GameOfLife />
        <div className={styles.stage} data-cursor-surface>
          <SysBar />
          {children}
          <SiteFooter />
        </div>
      </CursorPresence>
    </LifeEngineProvider>
  );
};
```

> `data-cursor-surface` を `stage`（中央コンテンツ列）に付与 → 座標基準になる。

- [ ] **Step 2: typecheck**

Run: `pnpm typecheck`
Expected: 緑。

### Task 5.2: SysBar に `watching N` + トグル

**Files:**

- Modify: `src/components/sys-bar/index.tsx`
- Modify: `src/components/sys-bar/styles.css.ts`

- [ ] **Step 1: styles 追加**

`styles.css.ts` 末尾に：

```ts
export const watching = css({
  color: 'accent.text',
});

export const toggle = css({
  fontFamily: 'mono',
  fontSize: 'xs',
  color: 'fg.muted',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  padding: '0',
  textDecoration: 'underline',
  _hover: { color: 'accent.text' },
});
```

- [ ] **Step 2: SysBar で PresenceContext 購読**

`status` div の中、`● rec` の隣に追加（`usePresence` を import）：

```tsx
import { usePresence } from '@components/cursor-presence/presence-context';
// SysBar 内:
const presence = usePresence();
// status span 群の末尾:
<span className={styles.watching}>watching {presence.count}</span>
<button type="button" className={styles.toggle} onClick={presence.toggle}>
  {presence.enabled ? 'cursors: on' : 'cursors: off'}
</button>
```

> ボタンは HTML `<button>`（ui rule 1: HTML+CSS 優先）。aria は text で十分。

- [ ] **Step 3: lint + typecheck**

Run: `pnpm lint && pnpm typecheck`
Expected: 緑。

### Task 5.3: island の browser test

**Files:**

- Create: `src/components/cursor-presence/cursor-presence.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { CursorPresence } from './index';
import { usePresence } from './presence-context';

const Probe = () => {
  const { enabled, toggle } = usePresence();
  return (
    <button type="button" onClick={toggle}>
      state:{enabled ? 'on' : 'off'}
    </button>
  );
};

describe('CursorPresence', () => {
  it('provides presence context and toggles enabled state', async () => {
    render(
      <CursorPresence>
        <div data-cursor-surface style={{ width: 400, height: 800 }} />
        <Probe />
      </CursorPresence>,
    );
    const btn = page.getByText(/state:/);
    await expect.element(btn).toHaveTextContent('state:on');
    await btn.click();
    await expect.element(btn).toHaveTextContent('state:off');
  });
});
```

> `next/navigation` は vitest browser project で mock 済（`src/__mocks__/next/navigation.ts`）。
> WebSocket 接続は `location.origin` への接続を試みるが、テスト環境では open しないため presence は 0 のまま。
> toggle のローカル状態のみ検証する（接続を要しない範囲）。

- [ ] **Step 2: Run test to verify it fails → 実装で通す**

Run: `pnpm vitest run --project browser src/components/cursor-presence/cursor-presence.test.tsx`
Expected: 最終的に PASS。失敗する場合は mock(navigation) の `usePathname` 戻り値を確認。

- [ ] **Step 3: SysBar test の回帰確認**

Run: `pnpm vitest run --project browser src/components/sys-bar/sys-bar.test.tsx`
Expected: PASS（`watching` 追加で既存 assertion が壊れていないこと）。

- [ ] **Step 4: 全テスト + lint + typecheck**

Run: `pnpm vitest run && pnpm lint && pnpm typecheck`
Expected: 全 PASS / 緑。

- [ ] **Step 5: Commit**

```bash
git add src/components/site-shell src/components/sys-bar src/components/cursor-presence
git commit -m "feat(cursor): wire presence into SiteShell + SysBar watching count"
```

---

## Phase 6: 手動検証 + レビュー

### Task 6.1: ローカル2タブ検証

- [ ] **Step 1: dev 起動**

Run: `pnpm dev`

- [ ] **Step 2: 2 つのブラウザタブで同一 URL を開く**

期待動作:

- 片方のカーソルがもう片方に `✕ #hash`（ユーザー色）で表示され、CSS transition で滑らかに追従。
- SysBar に `watching 2`。
- トグル `cursors: off` で他者非表示 + 自分の送信停止、`watching` は 2 のまま。
- 別 URL（例 `/about` があれば）では別部屋になり互いに見えない。
- DevTools で `prefers-reduced-motion` を有効化 → transition が消える。

- [ ] **Step 3: マイグレーション適用（DO は migration 必須）**

Run: `PAYLOAD_SECRET=dev-secret-change-me-in-production pnpm payload migrate` は不要（DO migration は wrangler 管理）。
DO は `wrangler.toml` の `[[migrations]] tag="v2"` により dev/デプロイ時に自動適用される。`pnpm dev`（wrangler/opennext 経由）で反映を確認。

### Task 6.2: difit でレビュー依頼

- [ ] **Step 1: difit 起動**

Run: `pnpm difit`（または既定のレビュー起動コマンド）して差分レビューを依頼する。

- [ ] **Step 2: finishing-a-development-branch スキルで統合方針を決定**

レビュー反映後、`superpowers:finishing-a-development-branch` で merge/PR/cleanup を選択。

---

## Self-Review チェック結果

- **Spec coverage:** 部屋粒度(3.2/3.4)、共有内容(protocol 1.4)、識別子(identity 1.3 + DO 3.1)、座標(1.2 + island 4.5)、補間(styles 4.4)、タッチ(pointer:fine 4.5)、見た目(4.4)、名前(1.3)、プレゼンスUI(5.2)、トグル(4.5/5.2)、再接続(4.3)、palette(2.1)、上限+N(4.4)、count(5.2)、a11y(4.4/5.2)、wrangler(3.4)、テスト(各 Phase) — 全項目にタスク対応あり。
- **Placeholder scan:** なし（各 step に実コード）。`let raf` のみ明示的に「ref 化する」手順(4.5 Step2)で除去。
- **Type consistency:** `Rect`/`Norm`/`Point`(coordinate)、`CursorColor`/`Identity`(identity)、`ClientMessage`/`ServerMessage`(protocol) を全 Phase で一貫使用。`deriveIdentity(uid)` の戻りを DO/island/test で共有。

## 既知の統合リスク（実装時に検証）

1. **worker ↔ src の型共有**: `src/lib/cursor/*` を worker から相対 import、`@worker/*` を src から import。
   tsgo がどちらの tsconfig でも解決できるか Phase 3/4 の typecheck で確認。NG 時は `worker/tsconfig.json`
   の include 調整 or 共有コードを `src/lib/cursor` に一本化（現案）で対処。
2. **durabcast createRoom override**: server socket 参照のため再実装（DRY とのトレード）。durabcast の
   バージョン更新で内部仕様が変わったら追従が必要。
3. **`$ws` 型生成**: `defineWebSocketHelper` 由来の `outputFormat:'ws'` が `CursorAppType` に乗るか、
   Phase 4 の client 型補完で確認。
