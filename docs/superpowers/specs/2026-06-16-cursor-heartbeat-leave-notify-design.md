# Cursor 切断検知の取りこぼし修正 — ハートビート刈り取りに leave/count 通知を接ぎ木

- Date: 2026-06-16
- Status: Approved (design)
- Scope: `worker/durable-objects/cursor-room.ts` のみ（クライアント・cadence 変更なし）

## 背景・問題

リアルタイムカーソル共有（`CursorRoom` DO + durabcast）で、切断したはずのカーソルが他の人の画面に残り続ける（ghost cursor）ケースがある。

### 根本原因

1. クライアントは 30 秒ごとに `"ping"` を送り、Cloudflare が `setWebSocketAutoResponse` で DO を起こさずに `"pong"` を自動返信し、`getWebSocketAutoResponseTimestamp(ws)` を更新する（`src/lib/cursor/visitor-pointer-app.ts:190`、`PING_INTERVAL_MS = 30_000`）。

2. durabcast 基底クラス `BroadcastMessage` の `alarm()` が `INTERVAL`（30 秒）ごとに走り、`isAliveSocket(ws)`（最終 ping から `TIMEOUT` = 60 秒以内なら生存）で死活判定する。死んだソケットは `ws.close()` で刈り取り、`this.sessions` から削除する。

3. **核心のバグ**: 基底 `alarm()` が `ws.close()`（サーバ発の close）を呼んでも、Cloudflare は自分の DO の `webSocketClose` ハンドラを発火させない。つまり `CursorRoom.webSocketClose`（`leave` + `count` を broadcast する箇所、`cursor-room.ts:139`）は **ハートビート刈り取り経由では一度も呼ばれない**。

結果として、「close フレームがサーバに届かない切断」——タブの突然 kill・ネットワーク断・モバイルのバックグラウンド/スリープ・ラップトップのフタ閉じ——では、ソケットが刈り取られても `leave` が飛ばず、ピアの画面にカーソルが残り続ける。

`webSocketClose` が正しく発火するのはクリーンな close フレームが届いた場合（明示的な `end()`、正常なタブクローズ）のみ。突然切断はハートビート刈り取りが唯一の安全網であり、その刈り取りが presence を通知していないのが欠陥。

### 補足: 再接続は既に問題ない

クライアントは `reconnecting-websocket` を使い、uid は IP 由来で安定している。ネットワークブリップで再接続すると新しいソケットが同一 uid + path で再 nav するため、後で古いゴーストソケットが刈り取られても「同一 uid の生存ソケットあり」と判定され leave は飛ばない（カーソルは新ソケットに引き継がれ継続）。ghost が問題になるのは**訪問者が本当に去り、二度と戻らない**ケースに限られる。

## 決定事項

- **検知の積極度**: 「通知の接ぎ木だけ（最小）」。現状の 30 秒 ping / 60 秒 timeout を維持し、刈り取り時に leave/count を通知するのみ。ghost は最悪 ~90 秒（alarm 粒度 30 秒 + timeout 60 秒）で消える。クライアント変更なし・差分最小・回帰リスク最小。
- **テスト**: DO 統合テストのみ（`worker/durable-objects/cursor-room.test.ts` に追加）。pure 関数抽出はしない（minimal スコープ志向）。

## 設計

### 中核: `alarm()` を override し「閉じる前に通知」する

```
durabcast base alarm() ＝ 30 秒ごと、isAliveSocket(最終 ping < 60 秒) で死活判定
       │
       ▼  ← ここに override で接ぎ木
┌─────────────────────────────────────────────┐
│ override async alarm():                       │
│   1. dead = [...this.sessions]                │  ← 基底と同じソース・同じ死活判定
│           .filter((ws) => !this.isAliveSocket(ws))
│   2. this.#notifyEvicted(dead)  ← leave/count 通知 │  ← 追加する唯一の振る舞い
│   3. await super.alarm()   ← 基底が close + alarm 再武装 │  ← 刈り取りは DRY に基底へ委譲
└─────────────────────────────────────────────┘
```

`super.alarm()` に「close + alarm 再武装」を委ねるので durabcast 内部を再実装せず壊れにくい。追加するのは **「閉じる前に通知する」一点だけ**。

dead の算出は基底 `alarm()` と完全に同じ（`this.sessions` を `isAliveSocket` でフィルタ）。`#notifyEvicted` と `super.alarm()` の間に await を挟まないため、両者が見る死活状態は同一 tick で一致する。

### `#notifyEvicted(dead: readonly WebSocket[])`

通知は `super.alarm()` が dead を閉じる**前**に行うため、その時点で dead はまだ `getWebSockets()` に含まれる。したがって leave 判定・count 計算では **dead を明示的に除外**する（close() の削除タイミングに依存しない＝堅牢）。

- **leave**: dead の各 distinct `(path, uid)` について、生存ソケット（`getWebSockets()` のうち dead に含まれないもの）に同じ `(path, uid)` が**無ければ** `leave`（`{ t: 'leave', id }`、`id = deriveIdentity(uid).id`）を当該 `path` へ broadcast（dead を除外して送信）。これは `webSocketClose` の「この uid の最後のソケットが閉じる時だけ leave」判定をバッチ化したもの。
- **count**: dead が触れた各 distinct `path` に、生存者だけで数え直した distinct uid 数を `count`（`{ t: 'count', n }`）として broadcast（dead を除外）。

dead を除外して送るのは、死にソケットには届かないため（`#send` が guard する）と、count 値を刈り取り後の真値にするため。

### 必要な小リファクタ: 単一 exclude → Set exclude

既存ヘルパは「単一ソケットを除外」する設計のため、バッチ刈り取り（複数の dead を一括除外）に対応できない。3 つのヘルパの除外引数を単一 → Set に一般化する:

| ヘルパ             | 変更前                | 変更後                              |
| ------------------ | --------------------- | ----------------------------------- |
| `#broadcastToPath` | `exclude?: WebSocket` | `excludes?: ReadonlySet<WebSocket>` |
| `#countOnPath`     | `exclude?: WebSocket` | `excludes?: ReadonlySet<WebSocket>` |
| `#hasUidOnPath`    | `exclude: WebSocket`  | `excludes: ReadonlySet<WebSocket>`  |
| `#broadcastCount`  | `exclude?: WebSocket` | `excludes?: ReadonlySet<WebSocket>` |

ループ内の `ws === exclude` 判定は `excludes?.has(ws) === true`（または `excludes.has(ws)`）に置き換える。

既存呼び出し側の更新（振る舞いは不変）:

- `webSocketClose`: `#hasUidOnPath(path, att.uid, new Set([ws]))`、`#broadcastCount(path, new Set([ws]))`、`#broadcastToPath(prevPath, ..., new Set([ws]))` 等。
- `#applyPath`: 同様に現在の単一 `ws` 除外を `new Set([ws])` に。
- alarm のバッチ刈り取り: `dead` を `Set` 化して渡す。

同じ述語（`#hasUidOnPath`）が `webSocketClose`（1 ソケット）と `alarm`（複数ソケット一括）の両方を綺麗に賄えるようになる。これにより「同一 uid の 2 タブが同時に死ぬ → leave は 1 回だけ」というバッチ固有のエッジが正しく成立する。

### `function` キーワード / メソッド構文

`alarm` は基底メソッドの override。既存の `webSocketClose` override に倣い `override async alarm(): Promise<void>` のメソッド短縮構文を用いる（`.claude/rules/function-style.md`: クラスメソッドはメソッド短縮構文）。

## データフロー（突然切断時）

```
訪問者がタブを突然 kill（close フレームがサーバに届かない）
   │
   │  クライアントの ping 停止
   ▼
60 秒経過 → isAliveSocket(ws) が false に
   │
   ▼  次の alarm（30 秒粒度、最悪 +30 秒）
override alarm():
   dead = [that ws]
   #notifyEvicted(dead):
      生存ソケットに同 (path,uid) 無し → leave{id} を path へ broadcast
      path の count を生存者で数え直して broadcast
   super.alarm(): ws.close() + sessions.delete + alarm 再武装
   │
   ▼
ピアのクライアント: applyMessage で leave 受信 → visitors から該当カーソル削除
count 受信 → 人数表示更新
```

## エラー処理・エッジケース

- **dead が空**: `#notifyEvicted([])` は何もせず即 return。`super.alarm()` がそのまま走る（生存ソケットがあれば再武装）。
- **同一 uid の複数 dead タブ**: distinct `(path, uid)` で畳むため leave は 1 回。
- **1 タブ dead・別タブ生存（同 uid）**: 生存ソケットが同 `(path, uid)` を持つため leave は飛ばない（count は数え直しで不変 or 反映）。
- **path 未設定の dead ソケット**（nav 前に死亡）: `path === undefined` のものは leave/count 対象外（`webSocketClose` の現行ガードと同じ）。
- **送信失敗**: 既存 `#send` の try/catch がソケットを `this.sessions` から落とすため、fan-out 全体は中断しない。
- **再武装**: `super.alarm()` の既存ロジック（`sessions.size > 0 && alarm === null` で `setAlarm`）に委譲。override 側で別途武装はしない。

## テスト計画（DO 統合テストのみ）

`worker/durable-objects/cursor-room.test.ts` に追加。既存の `connect` / `nav` / `settle` ヘルパを再利用。`cloudflare:test` の `runInDurableObject` / `runDurableObjectAlarm` で死にソケットを待ち時間ゼロ・決定論的に再現する。

死にソケットの作り方: テスト内ソケットは ping を送らないため `getWebSocketAutoResponseTimestamp` は null で、`isAliveSocket` は `connectedAt` にフォールバックする。`runInDurableObject` でサーバ側ソケットの attachment の `connectedAt` を `TIMEOUT`（60 秒）より過去に書き換えれば、`runDurableObjectAlarm` 実行時に dead 判定になる。

ケース:

1. **突然切断で leave が飛ぶ**: A・B を `/x` に接続 → `runInDurableObject` で A の `connectedAt` を過去に書き換え → `runDurableObjectAlarm` → B が `leave{ id: aUid }`（`deriveIdentity(aUid).id === aUid`、既存 nav-leave テストと同じ流儀）と `count: 1` を受信。
2. **同一 uid の片タブだけ dead なら leave は飛ばない**: 同 uid の tab1・tab2 を `/x` に接続、別 uid の B も `/x` → tab1 だけ `connectedAt` を過去に → alarm → B は当該 uid の leave を受信しない（tab2 が生存）。
3. **dead が無ければ何も通知しない（回帰防止）**: 全ソケット生存のまま `runDurableObjectAlarm` → 余計な leave/count が飛ばない。
4. **複数 dead で count を一度に数え直す**: 必要に応じて、別 path や複数 dead の count 反映を 1 ケース。

実装は TDD（Red → Green → Refactor）。既存テスト（join/replay/move/nav-leave/multi-tab close）が全て緑のままであることを確認する。

## 非対象（YAGNI）

- cadence（ping/timeout/alarm interval）の短縮。
- leave/count 判定の pure 関数抽出。
- クライアント（`visitor-pointer-app.ts`）の変更。
- durabcast 本体への変更。

## 影響ファイル

- `worker/durable-objects/cursor-room.ts` — `alarm()` override 追加、`#notifyEvicted` 追加、3 ヘルパの exclude を Set 化、既存呼び出し側を `new Set([ws])` に更新。
- `worker/durable-objects/cursor-room.test.ts` — 統合テスト追加。
