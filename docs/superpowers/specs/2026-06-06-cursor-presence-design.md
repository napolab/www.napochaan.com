# Cursor Presence — Design Spec

実装日: 2026-06-06 / status: draft（レビュー待ち）

閲覧者同士のカーソル位置をリアルタイム共有する機能。Cloudflare Durable Objects

- WebSocket で「同じページを見ている人の気配」を可視化する。

## 1. Goals / Non-goals

**Goals**

- 同じページ（同一 URL）を開いている閲覧者のカーソルをリアルタイムに見せる。
- 「今ここに N 人いる」というプレゼンスを伝える。
- white-base グラフィックデザイン maximalism の世界観に馴染む静かな演出。

**Non-goals (YAGNI)**

- チャット・リアクション・描画共有などの双方向コラボ機能。
- カーソル履歴の永続化／リプレイ。
- 認証・アカウント・フレンド機能。
- ページを跨いだ追跡（部屋はページ単位で独立）。

## 2. 決定事項（ブレストの結論）

| 項目          | 決定                                                                                                            |
| ------------- | --------------------------------------------------------------------------------------------------------------- |
| 部屋粒度      | ページ単位（room key = pathname、`idFromName(pathname)`）                                                       |
| 共有内容      | 正規化座標 `nx,ny` + 識別ラベル                                                                                 |
| 識別子        | `cf-connecting-ip` を salt 付き hash → 決定的に `color` + `#hash` ラベルを導出。IP 自体はクライアントへ出さない |
| 座標正規化    | コンテンツ列（`data-cursor-surface`）の document-bbox 基準で 0..1 化、受信側で逆変換                            |
| 補間          | CSS `transition: translate ~100ms linear`。`prefers-reduced-motion` で `none`                                   |
| タッチ        | `pointer:fine` のみ送信。touch 端末は受信表示のみ                                                               |
| 見た目        | `✕` グリフ + `#hash` ピル（ユーザー色）。`.tmp-mockups/prototype-v2.html` の `.cur` 準拠                        |
| 名前          | `#<hash4>`（例 `#a3f2`）。"Visitor #hash" の compact 表記                                                       |
| プレゼンス UI | SysBar に `watching N` + 表示トグル（localStorage 永続）                                                        |
| カーソル色    | 専用 `cursor.palette`（accessible 数色）を token 新設、hash で割当                                              |
| レンダー上限  | 30 人描画 + 超過は「+N more」バッジ。count は実数                                                               |
| トグル OFF    | 自分の move 送信停止 + 他者非表示。WS は維持し count には計上（lurker）                                         |
| 再接続        | `reconnecting-websocket` に委譲（自前バックオフ無し）。`pingWebSocket` keep-alive 併用                          |
| transport     | Hono RPC `$ws`（型安全）+ `reconnecting-websocket` を `hc` の `webSocket` option で注入                         |

## 3. アーキテクチャ

```
┌─────────────── Cloudflare Worker (worker/worker.ts) ───────────────┐
│  app.route('/', cursorRoutes)   ← WS ルートを opennext mount より前に登録  │
│  app.mount('/', opennextHandler)                                   │
│                                                                     │
│  cursorRoutes: GET /api/cursors/:room                              │
│    upgradeToRoom(defineWebSocketHelper) → stub.fetch(c.req.raw)     │
│         │ idFromName(pathname)                                      │
│         ▼                                                           │
│  ┌─ DO: CursorRoom extends BroadcastMessage (durabcast) ─┐          │
│  │  fetch(): Upgrade を受けて WebSocketPair + acceptWebSocket         │
│  │  接続時: cf-connecting-ip を hash → 決定的 color/label  │          │
│  │  webSocketMessage: zod parse → broadcast({excludes:self})         │
│  │  接続/切断で count を broadcast                          │          │
│  └────────────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────────┘
        ▲ wss (reconnecting-websocket)        │ broadcast
        │ {t:"move",nx,ny}                      ▼
┌─ Client island: <CursorPresence/> ('use client', (site)/layout に1つ) ─┐
│  usePathname → room                                                     │
│  hc<CursorAppType>(origin,{webSocket:RWS}).api.cursors[':room'].$ws()    │
│  data-cursor-surface の rect を測定 (ResizeObserver + scroll)            │
│  pointermove(pointer:fine) → rAF coalesce(~50ms) → nx,ny 送信            │
│  受信: 他者カーソルを ref 管理ノードへ imperative 反映, CSS transition で補間 │
│  presence count は PresenceContext 経由で SysBar が購読                   │
└─────────────────────────────────────────────────────────────────────────┘
```

### なぜこの構成か

- **DO が socket を保持**しないと、別 isolate のクライアントへ broadcast できない。
  よって socket 所有は DO（durabcast）に置く。
- 一方で **client の型安全な `$ws`** は、ルートが `outputFormat:'ws'`（= `upgradeWebSocket`
  / `defineWebSocketHelper` 由来）を持つ場合のみ生える（hono 4.12 `client/types.d.ts` で確認）。
- CF 版 `upgradeWebSocket` は worker 内で `WebSocketPair` を生成してしまい DO に渡せない。
  そこで **`defineWebSocketHelper` で「DO へ forward する upgrade helper」を自作**し、
  ws 型 marker を付けたまま実際の upgrade は DO に委ねる。

## 4. トランスポート詳細

### 4.1 Worker 側ルート（型輸出元）

```ts
// worker/routes/cursors.ts
import { defineWebSocketHelper } from 'hono/helper/websocket';
import { Hono } from 'hono';

const upgradeToRoom = defineWebSocketHelper(async (c) => {
  if (c.req.header('Upgrade') !== 'websocket') return; // void → 426 相当
  const room = c.req.param('room');
  const stub = c.env.CURSOR_ROOM.get(c.env.CURSOR_ROOM.idFromName(room));
  return stub.fetch(c.req.raw); // DO が 101 + webSocket を返す
});

export const cursorRoutes = new Hono<CursorEnv>()
  .get('/api/cursors/:room', upgradeToRoom((c) => ({})));

export type CursorAppType = typeof cursorRoutes;
```

- `room` は pathname を URL-safe に encode した文字列。`idFromName` に渡す。
- `cursorRoutes` を `worker.ts` で **opennext mount より前** に `app.route('/', cursorRoutes)`。

### 4.2 Browser client

```ts
// src/components/cursor-presence/use-cursor-socket.ts
import ReconnectingWebSocket from 'reconnecting-websocket';
import { hc } from 'hono/client';
import type { CursorAppType } from '@worker/routes/cursors';

const client = hc<CursorAppType>(location.origin, {
  webSocket: (url, protocols) =>
    new ReconnectingWebSocket(url, protocols, {
      maxEnqueuedMessages: 0, // 切断中の古い move を replay しない
    }) as unknown as WebSocket,
});

const ws = client.api.cursors[':room'].$ws({ param: { room } });
```

- 再接続バックオフ・keep-alive 中の自動再張りは reconnecting-websocket が担当。
- `pingWebSocket`（durabcast/helpers/client）で idle auto-close を回避。
- `@worker/*` の path alias を tsconfig に追加する（`paths` 変更は coding-rules に従い事前合意済み＝本 spec で確定）。

### 4.3 Durable Object（CursorRoom）

`durabcast` の `BroadcastMessage` を継承し、以下を上書き：

- `fetch(req)`: Upgrade 要求を受けて `WebSocketPair` + hibernation accept（durabcast 既定）。
  接続確立時に `cf-connecting-ip` を読み、identity を導出してソケットに attach（`serializeAttachment`）。
  本人へ `welcome`、他者へ `join` を broadcast。現在数を `count` で broadcast。
- `webSocketMessage(ws, raw)`: zod parse。`move` のみ受理し、`{t:"move", id, nx, ny}` を
  `broadcast({ excludes: [ws] })`。ping は durabcast の requestResponsePair で処理。
- `webSocketClose`: `leave` と更新後の `count` を broadcast。
- options: `autoClose: true`, `interval`/`timeout` 既定、`requestResponsePair: { request:'ping', response:'pong' }`。

> NOTE: durabcast の DO 内部ルーティング（`/rooms/:roomId`）と forward パスの整合は
> 実装時に確認する。必要なら `CursorRoom.fetch` を override して任意パスの upgrade を受ける。

## 5. メッセージプロトコル（query/command 原則）

zod schema を `src/lib/cursor/protocol.ts` に置き、server/client で共有。

```
client → server (command):
  { t:"move", nx:number(0..1), ny:number(0..1) }

server → clients:
  { t:"welcome", self:{ id, color, label } }   // 接続直後に本人だけへ
  { t:"join",  id, color, label }
  { t:"move",  id, nx, ny }
  { t:"leave", id }
  { t:"count", n:number }
```

- `id`: identity hash（短縮 hex）。`color`: cursor palette のキー。`label`: `#<hash4>`。
- 受信メッセージは zod parse。失敗は握り潰さず `console.warn`（silent failure 禁止）。

## 6. 座標正規化（純関数）

`src/lib/cursor/coordinate.ts`：

```ts
type Rect = { left: number; top: number; width: number; height: number };
// 送信: surface の document 内 bbox 基準（scroll 非依存）
export const toNormalized = (rect: Rect, pageX: number, pageY: number): Norm =>
  ({ nx: (pageX - rect.left) / rect.width, ny: (pageY - rect.top) / rect.height });
// 受信: 各自の surface rect に逆変換
export const fromNormalized = (rect: Rect, n: Norm): Point =>
  ({ x: rect.left + n.nx * rect.width, y: rect.top + n.ny * rect.height });
```

- `rect` は `data-cursor-surface` 要素の `getBoundingClientRect()` + `scrollX/Y` から算出した
  document 座標系の bbox。`ResizeObserver` と `scroll`（passive）で更新。
- 列外（余白上）に出た座標は clamp せず ±はみ出しを許容。
- 純関数なので vitest 単体テスト対象。

## 7. アイデンティティ導出

`src/lib/cursor/identity.ts`（DO 側で使用、決定論的・純粋）：

- `hash = SHA-256(ip + SALT)` を `crypto.subtle.digest` で計算 → 先頭 hex を取り出す。
- `label = "#" + hash.slice(0, 4)`。
- `color = CURSOR_PALETTE[ parseInt(hash.slice(4, 8), 16) % CURSOR_PALETTE.length ]`。
- `SALT` は環境変数（secret）。IP は導出にのみ使い、クライアントへは出さない。

### cursor.palette（新設 token）

現 token は gray/blue/red の 3 hue のみで多人数だと色が被るため、**専用の
`cursor.palette` を token に新設**する（`#hash` ラベルが一次識別子、色は副次フレーバー）。

- accessible な数色（例: 6〜8 色）を `src/themes/tokens` に追加。各エントリは
  `{ bg, fg }` ペアで保持し、ピル背景と前景文字のコントラストを WCAG 2.1 AA で担保。
- `identity.ts` は色名（palette のキー）を返し、クライアントが CSS var に解決する。
- palette の色相は既存 blue/red を含めつつ、判別に足る hue 差を持たせる（具体色は
  token 実装時に WCAG 検証して確定）。

## 8. クライアント島（components/cursor-presence）

```
src/components/cursor-presence/
  index.tsx            ← 'use client'。(site)/layout に1つ mount。PresenceProvider も内包
  use-cursor-socket.ts ← hc+RWS 接続, 送受信, ping, room=pathname
  cursor-layer.tsx     ← fixed overlay。受信ノードを ref Map 管理 + CSS transition
  presence-context.ts  ← { count, enabled, toggle } を提供（SysBar が購読）
  styles.css.ts
```

- 位置更新は React state ではなく **ref 管理 DOM ノードへ imperative**（`translate` 更新）。
  React 再レンダーは join/leave/count のみ。
- レイヤーは `position:fixed; inset:0; pointer-events:none; z-index:(SysBar 直下)`。
- 各カーソル: `<span class="x">✕</span><span class="id">#a3f2</span>`、色はユーザー色。
- **レンダー上限 30**。30 人分を描画し、超過分は描画せず **「+N more」バッジ**で明示。
  SysBar の count は実数（接続数）を表示し silent cap にしない。
  - "+N more" バッジはカーソルレイヤー隅に固定配置（pointer-events:none）。
  - どの 30 人を描くかは「先着接続順」（join 受信順）で安定させる。

## 9. プレゼンス UI（SysBar）

- 既存 `SysBar` に PresenceContext を購読する小要素を追加：既存の `clock / gen 0000 /
alive 12 / ● rec` と並ぶ mono system-info として **`watching N`** を表示（N=接続数）。
- 表示トグル（カーソル ON/OFF）も SysBar の status 群に置く。`localStorage` で永続。
- トグル OFF: 他者カーソル非表示 + 自分の move 送信停止。WS は維持（count 計上継続）。

## 10. アクセシビリティ / オプトアウト

- `prefers-reduced-motion: reduce` → cursor の CSS transition を `none`（mockup 準拠）。
- WCAG 2.1 AA: cursor 色 + ラベルは前景/背景コントラストを満たす palette を使用。
- トグルは react-aria-components の `ToggleButton` で実装（HTML+CSS で足りなければ）。
- pointer-events:none によりカーソルレイヤーが操作を阻害しない。

## 11. wrangler / DO migration

```toml
[[durable_objects.bindings]]
name = "CURSOR_ROOM"
class_name = "CursorRoom"

[[migrations]]
tag = "v2"
new_sqlite_classes = ["CursorRoom"]   # durabcast の hibernation 要件に合わせる
```

- `worker.ts` で `export { CursorRoom } from './durable-objects/cursor-room'`。
- staging / production env にも同 binding を追加。

## 12. テスト（TDD / vitest）

| 対象            | 種別         | 内容                                                                |
| --------------- | ------------ | ------------------------------------------------------------------- |
| `coordinate.ts` | unit         | to/fromNormalized が rect 違いで相対位置を保持                      |
| `identity.ts`   | unit         | 同一 IP→同一 label/color（決定性）、異 IP→分散                      |
| `protocol.ts`   | unit         | zod parse の受理/拒否、不正メッセージ                               |
| `CursorRoom`    | workers pool | 接続→welcome/join、move broadcast(excludes self)、close→leave/count |
| island          | browser mode | toggle で表示/送信が切れる、reduced-motion で transition 無効       |

`@cloudflare/vitest-pool-workers` は設定済み。DO テストは test env binding に `CURSOR_ROOM` を追加。

## 13. 確定済み decision（旧 Open knobs）

1. **cursor palette**: 専用 `cursor.palette`（accessible 数色）を token 新設し hash で割当。
   具体色は token 実装時に WCAG 2.1 AA で検証して確定（Section 7 参照）。
2. **レンダー上限超過**: 30 人描画 + 「+N more」バッジ。SysBar の count は実数（Section 8）。
3. **count 表記**: SysBar に `watching N`（mono system-info、Section 9）。

## 14. 段階実装（後続の plan で分割）

1. `lib/cursor`（protocol / coordinate / identity）＋ unit test。
2. `CursorRoom` DO ＋ worker route ＋ wrangler migration ＋ DO test。
3. client island（socket / layer）＋ browser test。
4. SysBar presence ＋ toggle 統合。
5. `data-cursor-surface` を SiteShell/layout に付与し結線、difit でレビュー。
