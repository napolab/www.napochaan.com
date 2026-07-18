# richText 動画埋め込み調査 (2026-07-18)

対象: blog / works の richText (lexical) 本文に映像を埋め込む機能。
前提スタック: Next.js 15 + Payload CMS 3 + OpenNext on Cloudflare Workers、media は R2 (`@payloadcms/storage-r2`)。

## TL;DR

- 「R2 の MP4 は streaming できない」という前提は**成立しない**。R2 は HTTP Range request 対応、Workers はストリーム応答にボディサイズ制限なし。`ffmpeg -movflags +faststart` で moov atom を先頭に置いた MP4 なら、`<video>` タグだけで即時再生+シークが動く。
- 10s〜3min の短尺クリップ(VJ 素材・モーション・画面収録)なら **R2 + faststart MP4 が $0 で成立**し、client JS もゼロ。
- 欠点は ABR(帯域に応じた画質切替)がないことだけ。長尺トーク動画で回線が悪いとバッファる。そこが必要になったら Cloudflare Stream ($5/月〜) を後から足せる。

## 1. 配信方式の比較

### R2 + faststart MP4(直配信)

- **Range request**: R2 Workers API の `get()` は `range` オプション対応、HTTP 条件ヘッダも `If-Range` 以外サポート。公開バケット/S3 API 経由の Range GET も可。
  - 注意: コミュニティで「Range に 206 でなく 200 が返る」報告が散発的にあり(webm 中心、MP4 は最も安定)。documented limitation ではない。
- **faststart**: `ffmpeg -movflags +faststart` で moov を先頭へ。ブラウザは先頭バイトでインデックスを読み、即再生開始・シークは Range で解決。
- **サイズ感**: 1080p 5Mbps の 3min ≈ 110MB、15s ループ ≈ 5–10MB。
- **Workers 制限**: レスポンスボディサイズ制限なし。`object.body` をバッファせず pipe すれば 128MB isolate メモリにも乗らない。Cache API は Range を尊重(フルレスポンスをキャッシュし 206 部分応答)。CDN キャッシュ対象は 512MB まで。
- **コスト**: storage $0.015/GB-mo(10GB 無料)、Class B read $0.36/M(10M 無料)、egress 無料 → ポートフォリオ規模なら **実質 $0/月**。
- **配信経路**: 現状は Payload の REST route `/api/media/file/<filename>`(Worker 経由、r2Storage plugin がストリーム)。`r2.dev` は rate limit ありの開発用で不可。バケットにカスタムドメインを張れば CDN キャッシュが効くが、mp4 はデフォルトキャッシュ拡張子に**含まれない**ので Cache Rule が必要。

### Cloudflare Media Transformations(`/cdn-cgi/media/`)

- 2025-11 GA。ゾーン単位で有効化。$0.50/1,000 transformations、**月 5,000 無料**。`mode=video` は出力1秒 = 1 transformation。
- R2 カスタムドメインをオリジンに、`mode=video,width=960,audio=false` でダウンサイズ・音声除去したループ用レンディション、`mode=frame` で poster 画像を生成。出力は CDN 自動キャッシュ。
- **制限**: 入力 ≤100MB / ≤10min / H.264 MP4 のみ。`mode=video` の出力は **最大 60 秒**・最大辺 2000px・単一レンディション(ABR なし)→ 長尺の配信経路にはならない。ambient ループの最適化レイヤとして有用。

### Cloudflare Stream

- **料金**: storage $5/1,000min(**前払い、実質 $5/月が最低ライン**、無料枠なし)+ delivery $1/1,000min。エンコード無料。
- **アップロード**: dashboard / HTTP(≤200MB)/ tus / **upload-via-link(R2 の URL を渡して pull させる → Payload hook と相性良)** / Direct Creator Upload。最大 30GB。
- **再生**: iframe player(`autoplay&muted&loop&controls=false` 等 query param 対応、`@cloudflare/stream-react` あり)/ HLS `.m3u8` + DASH `.mpd` で custom player(hls.js / Safari native)。2026-04 から VOD HLS は fMP4 セグメント。
- サムネイル: `thumbnails/thumbnail.jpg?time=2s`、animated GIF サムネは配信課金対象外。
- 署名 URL(JWT、Workers binding で署名可)、MP4 ダウンロード有効化可。
- コミュニティの Payload 用 adapter: `payload-video-stream`(upload → Stream 転送、jobs queue で ready 待ちポーリング)。
- **利点は ABR**。長尺トーク動画・低速回線に強い。短尺ループには過剰で、iframe embed は重い。

### R2 + DIY HLS

- ffmpeg で事前トランスコード(Workers に ffmpeg はないのでローカル/CI)、セグメント群を R2 へ、hls.js(~80KB)で再生。
- 短尺クリップでは ABR の恩恵が薄い割に、公開パイプライン・複数ファイル管理・削除時のセグメント掃除・client JS 追加と負担だけ大きい。**Stream の $5 が肩代わりしてくれる労働そのもの → 非推奨**。

### サードパーティ

| Provider     | 料金 (2026)                                                                           | 備考                                                                 |
| ------------ | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Mux          | encode 無料(baseline)、storage $0.007/min-mo、delivery $0.00059/min(月 100k min 無料) | DX 最良だがベンダー追加                                              |
| Bunny Stream | storage $0.01/GB、delivery $0.005–0.01/GB、最低 $1/月                                 | 最安 managed。CF ではない                                            |
| Vimeo        | Starter ~$12/月〜、帯域 2TB/月上限                                                    | 2026-02 のプラン改定で forced-upgrade 苦情。YouTube と同種の煩わしさ |

### 比較マトリクス(短尺クリップ用途)

|                   | R2+faststart MP4                                     | +Media Transformations | Stream                             | DIY HLS              | Mux/Bunny    |
| ----------------- | ---------------------------------------------------- | ---------------------- | ---------------------------------- | -------------------- | ------------ |
| 月額(この規模)    | ~$0                                                  | ~$0(5k 無料)           | $5〜                               | ~$0                  | ~$0–1        |
| Payload workflow  | 既存 R2 media そのまま                               | 同左+URL prefix        | 追加ホップ(plugin/hook+ready 待ち) | 最悪(外部 transcode) | ベンダー追加 |
| シーク/streaming  | Range で良好(ABR なし)                               | 同左                   | 最良(HLS/DASH ABR)                 | 良(ABR 可)           | 最良級       |
| ambient loop 再生 | `<video autoplay muted loop playsinline>` のみで完璧 | +自動縮小/音声除去     | iframe param(embed 重め)           | hls.js island 必要   | player SDK   |
| 長尺+低速回線     | バッファる                                           | 60s 出力上限で不可     | 対応                               | 対応                 | 対応         |
| client JS         | **ゼロ**                                             | ゼロ                   | ゼロ(iframe) or hls.js             | ~80KB                | SDK          |

## 2. コードベース側の実装ポイント

カスタムブロックは現状 `image-row` の1つだけで、これがそのままテンプレートになる。

video ブロック追加の touch-set:

1. `src/collections/media.ts` — `upload.mimeTypes` に `video/*` を追加(現状 `['image/*', 'application/pdf']` で動画は弾かれる)
2. `src/blocks/video/index.ts` — 新規 `Block` 定義(+ markdown round-trip 用の `fence/`)
3. `src/lib/payload/editor-features/index.ts` — `BlocksFeature({ blocks: [...] })` に追加(blog/works/news/bio すべての richText に自動適用)
4. `src/components/rich-text/converters/types.ts` — `NodeTypes` union を拡張(BlocksFeature のみのブロックは payload-types.ts に出ないため手書き)/ `converters/index.tsx` の `blocks` キーに converter を spread / `converters/video/index.tsx` 新規
5. `src/utils/lexical/to-markdown/index.ts` — 公開 `.md`/llms 出力用の第2レンダラに `case 'block'` 分岐を追加
6. `src/blocks/video/mcp-support/index.ts` — `McpBlockSupport` 実装 + `src/lib/mcp/markdown/index.ts` の `blockSupports` に登録
7. seed パイプライン — **コード変更不要**。sentinelize/resolve の deep-walk は block `fields` を汎用に辿るため、標準の `upload relationTo:'media'` フィールドなら自動で `{ __file, __alt }` sentinel 化される
8. 動画 upload の描画 — 現状 `converters/upload/index.tsx` は非 image mimeType を `<a>` ダウンロードリンクにフォールバックする。standalone upload node で動画が来た場合の扱いも決める必要あり

備考: wrangler.toml に Stream binding は存在しない。media 配信はカスタムドメインなしの Worker 経由(`/api/media/file/`)のみ。

## 3. 推奨

**R2 + faststart MP4 を default の video ブロックとして実装**:

- ambient(VJ ループ等): `<video autoplay muted loop playsinline>` — client JS ゼロ、RSC のまま
- トーク系: `controls preload="metadata" poster=...` — poster は Media Transformations の `mode=frame` か手動指定
- faststart 化は入稿時の運用(ffmpeg 一発)or 将来的に upload hook で検証
- ABR が本当に必要な長尺が出てきた段階で Stream を追加(upload-via-link で R2 から pull させる導線が既存構造と相性良)

DIY HLS は労力対効果で却下。サードパーティは Cloudflare 主義に反するので却下。

## Sources

- https://developers.cloudflare.com/stream/pricing/
- https://developers.cloudflare.com/stream/uploading-videos/
- https://developers.cloudflare.com/stream/viewing-videos/using-the-stream-player/
- https://developers.cloudflare.com/stream/viewing-videos/securing-your-stream/
- https://developers.cloudflare.com/stream/transform-videos/
- https://developers.cloudflare.com/r2/api/workers/workers-api-reference/
- https://developers.cloudflare.com/r2/pricing/
- https://developers.cloudflare.com/r2/buckets/public-buckets/
- https://developers.cloudflare.com/workers/platform/limits/
- https://developers.cloudflare.com/workers/runtime-apis/cache/
- https://www.mux.com/pricing
- https://bunny.net/pricing/stream/
- https://github.com/webowodev/payload-video-stream
