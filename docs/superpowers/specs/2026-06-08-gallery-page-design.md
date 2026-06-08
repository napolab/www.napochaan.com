# /gallery ページ 設計仕様

- 日付: 2026-06-08
- ブランチ: `feat/gallery-page`
- 関連メモ: `site-pages-ia`（下層ページ IA）/ `design-direction`（白地マキシマリズム・グリッド吸着可変スパン）/ `colophon-design-system-page`（Gallery は heavy で code-split）
- 関連 spec: `docs/superpowers/specs/2026-06-06-site-pages-ia-design.md`

## 1. 目的とスコープ

トップの gallery teaser（固定6エリアの編集グリッド）に対応する **フル `/gallery` ページ**を実装する。
teaser が「ちょうど6枚」専用なのに対し、フルページは **枚数非依存のアーカイブ面**にする。

- 中身: 既存6枚（flyer×2 + VRChat×4）+ Codex `$imagegen` で生成する +10枚 = **計16枚前後**。CMS 接続までは sample data。
- カテゴリ: **分けず1つの流れ**。caption に種別（`flyer / 04.24` `VRChat` 等）を出すのみ。
- レイアウト: **skyline アルゴリズムによる可変幅 masonry**（lightbox 付き）。
- teaser（`_components/gallery-section` + `components/gallery`）は**温存**。本ページは別レイアウトを用意する。

### スコープ外

- CMS（Payload）連携（後続 plan）。本ページは `sample-gallery.ts` を読む。
- カテゴリのフィルタ/タブ UI。
- gallery 詳細ページ（`/gallery/[id]`）。lightbox で完結。

## 2. レイアウト方針: skyline パッキング

参考: https://katashin.info/posts/skyline-algorithm/

CSS Grid/Flex/columns は「列を固定してから詰める」ため、可変幅・隙間最小・順序保持を同時に満たせない。
skyline は **上端の輪郭線（(x, y) 点列）の最も低い位置に各要素を貪欲配置**する 2D パッキングで、これらを満たす。

- **列吸着（grid-snapped）**: x は列境界に制約（xConstraints）。`列幅 colW = (W - (cols-1)*gap) / cols`。
  s 列スパンの要素幅 = `s*colW + (s-1)*gap`。x は `k*(colW+gap)` のいずれか。
- **可変スパン**: アスペクト比で列スパンを決める。
  - portrait（flyer, `h/w >= 1.2`）→ 1 列
  - wide（VRChat 横, `w/h >= 1.6`）→ 2 列
  - それ以外（正方〜やや横）→ 1 列
  - ※ `cols < 2` のブレークポイント（mobile=2列）では 2 列スパンは上限 = 全幅。スパンは `min(span, cols)` でクランプ。
- **高さ**: 幅確定後 `itemH = itemW * (intrinsicH / intrinsicW)`。intrinsic 値は画像 import から既知（DOM 計測不要）。
- **順序保持**: source 順に処理し、各要素を「収まる最低・最左の列開始位置」に置く。look-ahead（次2〜3件が現在の配置で空いた隙間に入るなら詰める）で断片化を減らすが、**順序は安定**に保つ。
- **レスポンシブ列数**: mobile **2** / tablet **3** / desktop **4**。

### フォールバック（progressive enhancement）

- **baseline（SSR / JS無し）**: `<ul>` を CSS `columns: N` で描画。純 HTML+CSS で成立（ui rule 1）。
- **enhance（client / 計測後）**: skyline で各 `<li>` を絶対配置に切替。`ResizeObserver` で幅変化時に再パック。
- DOM の要素順は両モードで source 順 = 読み順・タブ順を保持（a11y）。

## 3. アーキテクチャ / コンポーネント分割

```
src/app/(site)/gallery/
├─ page.tsx                     # RSC. PageHeader + GalleryArchive。ISR revalidate=3600
├─ styles.css.ts
├─ sample-gallery.ts            # 計16件の GalleryPhoto[]（既存6 + 生成10）。CMS 接続まで
└─ _components/
   └─ gallery-archive/
      ├─ index.tsx              # 'use client'. 幅計測→pack→絶対配置描画。CSS columns fallback 内包
      ├─ styles.css.ts
      ├─ gallery-archive.test.tsx
      └─ skyline/              # 純ロジック（TDD 主対象, ページローカル）
         ├─ pack.ts            # pack(items, { width, gap, columns }) → { placements, totalHeight }
         ├─ pack.test.ts
         ├─ resolve-columns.ts # resolveColumns(width) → 2|3|4
         └─ resolve-columns.test.ts

src/components/gallery/
├─ index.tsx                    # 既存 editorial（teaser 用）。lightbox は下の共有を使うよう差し替え
└─ lightbox/                    # 既存 GalleryCell から抽出する共有 lightbox セル
   ├─ index.tsx                 # 'use client'. react-aria DialogTrigger/Modal/Dialog
   ├─ styles.css.ts
   └─ lightbox.test.tsx
```

> 配置方針: skyline は純ロジック（視覚コンポーネントでない）かつ現状この1ページ専用なので **ページローカル**に置き、colophon デモ登録の対象外とする（components.md は「新規 src/components の showcase 必須」だが、本件は gallery ファミリー内の抽出と page ローカルロジックに留め、design-system 面の churn を避ける）。再利用要求が出たら src/components へ昇格。

### 3.1 `gallery-archive/skyline/pack.ts`（純関数・単一責任）

```ts
type PackItem = { id: string; width: number; height: number; span: number }; // intrinsic w/h, 列スパン
type Placement = { id: string; x: number; y: number; width: number; height: number };
type PackResult = { placements: Placement[]; totalHeight: number };
type PackOptions = { width: number; gap: number; columns: number };

export const pack = (items: readonly PackItem[], options: PackOptions): PackResult => { ... };
```

- 副作用なし・同入力同出力。`let` 不使用（skyline 配列は immutable 更新 or const オブジェクトの可変フィールド方式、functional-programming.md 準拠）。
- スパンは `min(item.span, columns)` にクランプ。
- skyline 状態 = `{ x, y }[]`（x 昇順）。配置: 各列開始 x 候補で、その要素幅が覆う区間の skyline 最大 y を求め、最小になる候補を選ぶ→ skyline 更新。

### 3.2 `gallery-archive`（client island）

- props: `photos: GalleryPhoto[]`。
- `useRef` でコンテナ、`ResizeObserver` で幅取得。`useBreakpoint` 相当は列数を CSS var/計測幅から決定（幅閾値で columns を導出する純関数 `resolveColumns(width)` を別出し）。
- 幅未確定（初期）は **CSS columns fallback** を描画（`data-mode="flow"`）。計測後 skyline 絶対配置（`data-mode="packed"`）。
- 各セルは `Lightbox`（共有）でラップ。caption は editorial と同じ mono タグ。
- Promise/handler 規約: handler は async 直書き（coding-rules）。

### 3.3 `components/gallery/lightbox`（共有抽出）

- 既存 `components/gallery/index.tsx` の `GalleryCell` 内の `DialogTrigger`+`ModalOverlay`+`Modal`+`Dialog`+`close` を **そのまま** 共有コンポーネント化。
- editorial `Gallery` と masonry `gallery-archive` の両方が使う。
- 既存 `gallery.test.tsx` は green を維持（overlay の `data-testid="gallery-overlay"` 等の挙動不変）。
- これは「作業に影響する既存の共有関心の抽出」= 限定的な改善（不要なリファクタは行わない）。

### 3.4 `gallery/sample-gallery.ts`

```ts
type GalleryPhoto = {
  id: string;
  src: string; width: number; height: number; // import から
  alt: string;
  caption?: string;       // 'flyer / 04.24' / 'VRChat' 等
  kind: 'flyer' | 'vrchat'; // span 決定の素。aspect からも導出可だが明示
};
```

- 既存6（`(site)/_assets/*.jpg`）+ 生成10。span は kind/aspect から `gallery-archive` 側で算出。

## 4. 素材生成（Codex `$imagegen`）

- 既存6枚は流用。**+10枚生成**（flyer 系・VRChat 系をバランス良く、横長を含めて可変スパンが映る構成）。
- 世界観: booth2booth（VRChat の DJ イベント）= electric blue / glitch / クラブ / mono system 注釈。
- アスペクト: flyer = 縦長ポスター（例 1080×1350）、VRChat = 16:9 横 と 正方を混ぜる。
- 保存先: `~/.codex/generated_images/` → `src/app/(site)/_assets/` に命名移動（jpg）。
  ⚠️ jpg import の path ミスは typecheck を通り抜ける（ambient module）。移動後は実ファイル存在を `ls` で検証し、`pnpm build` で確認。

## 5. ページ配線

- `page.tsx`（RSC）: `PageHeader title="gallery"` / breadcrumbs `home > gallery` / kicker `// flyer · VRChat — 2024–2026` / lead は声「〜😁」。
- `export const revalidate = 3600`（ISR、他ページと parity）。
- `<main id="main-content">` 配下に `<section>`（見出し or aria-label 必須: semantic-html.md）。PageHeader の h1 が見出しなので、archive section は `aria-label="作品ギャラリー"` 等。
- home `GallerySection` の `moreHref="/gallery"` は配線済み（既存）。

## 6. テスト（vitest, TDD）

- **`pack.test.ts`（TDD 主対象）**: 空配列 / 単体 / 順序保持 / 重なりなし（全 placement の矩形が非交差）/ 最低位置貪欲 / 可変スパン / スパンの columns クランプ / look-ahead で隙間が埋まる / totalHeight 正当性。
- `resolveColumns` 純関数: 閾値境界（mobile/tablet/desktop）。
- `gallery-archive.test.tsx`（browser mode）: N セル描画 / lightbox 開閉（共有 Lightbox 経由）/ fallback→packed の data-mode 切替。
- `lightbox.test.tsx`: open で overlay 表示・close/backdrop で閉じる（既存挙動の移植）。
- 既存 `components/gallery/gallery.test.tsx`: green 維持。

## 7. 完了条件 / 検証

- `pnpm lint && pnpm typecheck` green。
- `pnpm build`（or dev）で /gallery 描画・skyline パック・lightbox・CSS columns fallback・16枚 assets 解決を目視確認。
- WCAG 2.1 AA: caption コントラスト（ink bg + onSolid text、editorial 流用）/ lightbox focus trap（react-aria）/ focus ring（layerStyle focusRing）。
- 実装は小タスク分割で subagent に委譲。完了後 difit で review 依頼。

## 8. ビルド順（小タスク）

1. `components/lightbox` 抽出 + 既存 `Gallery` を差し替え（既存テスト green 維持）。
2. `components/skyline/pack.ts` を TDD（pack + resolveColumns）。
3. 素材 +10枚生成 → `_assets/` 配置 → `sample-gallery.ts`。
4. `gallery-archive`（client, fallback + skyline 適用 + lightbox）。
5. `gallery/page.tsx` 配線（PageHeader + archive + ISR）。
6. lint / typecheck / build 確認 → difit。
