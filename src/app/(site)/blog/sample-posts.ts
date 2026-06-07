import { readingMinutes } from '@utils/reading-minutes';
import { richTextFromBlocks } from '@utils/sample-rich-text';

import type { Post } from './_lib/post';

type Block = { type: 'h2' | 'h3' | 'p'; text: string };

// Build a post from its metadata + body blocks: `readMin` is derived from the
// blocks' joined text length (not hand-set), `body` is the rendered rich text.
const post = (meta: Omit<Post, 'readMin' | 'body'>, blocks: readonly Block[]): Post => ({
  ...meta,
  readMin: readingMinutes(blocks.map((block) => block.text).join('')),
  body: richTextFromBlocks(blocks),
});

// Sample — replaced by a Payload `blog` collection later; the home teaser shows
// the latest few of this feed. 11 posts so the list paginates (PAGE_SIZE 10 →
// 2 pages), spanning 2026-05 → 2025-11. `source` is among 'zenn' / '静か'
// (しずかなインターネット). Topics fit the owner — a programmer / DJ / VJ who
// writes on Zenn and しずかなインターネット. Each body carries 2–3 h2 (and an
// occasional h3) plus short Japanese paragraphs so the TOC has entries.
export const posts: readonly Post[] = [
  post({ id: '1', index: '01', title: '静かなインターネットの話', source: '静か', date: '2026-05-20', excerpt: '個人サイトを作り直しながら考える、自分のためのインターネットについて。' }, [
    { type: 'h2', text: 'なぜ作り直したのか' },
    { type: 'p', text: '既製のテンプレートに自分を寄せていくうちに、サイトが自分のものではなくなっていく感覚があった。だから一度すべてを白紙に戻すことにした。' },
    { type: 'h2', text: '静かであること' },
    { type: 'p', text: '通知も、いいねも、流速もない。ただ置いておくだけの場所として、インターネットの一区画を確保しておきたかった。' },
    { type: 'h3', text: '更新の頻度について' },
    { type: 'p', text: '書きたいときに書く。それ以上のことを自分に課さないと決めた。' },
  ]),
  post({ id: '2', index: '02', title: 'Panda CSS で作る design token', source: 'zenn', date: '2026-05-10', excerpt: 'OKLCH と semantic token で WCAG AA を機械的に担保する話。' }, [
    { type: 'h2', text: 'semantic token という考え方' },
    { type: 'p', text: '色を「青」ではなく「accent」と呼ぶ。役割で名付けることで、テーマの差し替えが値の差し替えに閉じる。' },
    { type: 'h2', text: 'OKLCH で明度を揃える' },
    { type: 'p', text: '知覚的に均一な色空間で明度を固定すると、コントラスト比が破綻しにくい。AA 基準を設計段階で担保できる。' },
    { type: 'h2', text: 'strictTokens を有効にする' },
    { type: 'p', text: '生の値をビルドエラーにすることで、design token の外側に逃げ道がなくなる。これが一番効いた。' },
  ]),
  post({ id: '3', index: '03', title: 'Cloudflare Workers で Next.js を動かす', source: 'zenn', date: '2026-04-28', excerpt: 'OpenNext と ISR をエッジで両立させるための構成メモ。' }, [
    { type: 'h2', text: 'なぜ Workers なのか' },
    { type: 'p', text: 'エッジで動くことの速さと、運用のシンプルさ。個人サイトにはこの組み合わせがちょうどよかった。' },
    { type: 'h2', text: 'OpenNext の役割' },
    { type: 'p', text: 'Next.js のビルド成果物を Workers のランタイムに橋渡しする。ISR のキャッシュ層もここで吸収される。' },
    { type: 'h3', text: 'ISR の落とし穴' },
    { type: 'p', text: 'path-keyed なキャッシュは revalidateTag では消えない。revalidatePath を併用する必要がある。' },
  ]),
  post({ id: '4', index: '04', title: 'Hono RPC で型安全な通信を作る', source: 'zenn', date: '2026-04-15', excerpt: 'サーバとクライアントの間に型の境界を引かないという選択。' }, [
    { type: 'h2', text: 'RPC クライアントの嬉しさ' },
    { type: 'p', text: 'エンドポイントの型がそのままクライアントに流れてくる。手書きの型定義を維持する手間が消える。' },
    { type: 'h2', text: 'WebSocket への拡張' },
    { type: 'p', text: 'hc の $ws と reconnecting-websocket を組み合わせれば、双方向通信にも同じ型安全を持ち込める。' },
  ]),
  post({ id: '5', index: '05', title: 'y-durableobjects で共同編集を実装する', source: 'zenn', date: '2026-03-30', excerpt: 'Durable Object を権威サーバにした CRDT 同期の設計。' }, [
    { type: 'h2', text: 'CRDT と権威サーバ' },
    { type: 'p', text: 'Yjs のドキュメントを Durable Object が一つだけ保持する。全クライアントはここを経由して同期する。' },
    { type: 'h2', text: 'WebSocket のルーティング' },
    { type: 'p', text: 'upgrade リクエストを DO まで forward する。defineWebSocketHelper で自作した。' },
    { type: 'h2', text: '永続化の戦略' },
    { type: 'p', text: 'スナップショットと差分を SQLite に書き分けることで、再接続時の復元コストを抑えた。' },
  ]),
  post({ id: '6', index: '06', title: 'VJ セットの設計図', source: '静か', date: '2026-03-12', excerpt: '映像を「曲に合わせる」のではなく「場に合わせる」という発想。' }, [
    { type: 'h2', text: '場の熱量を読む' },
    { type: 'p', text: 'フロアの温度はその日にしか分からない。だからセットは半分だけ決めて、残りは即興に明け渡す。' },
    { type: 'h2', text: 'レイヤーの組み方' },
    { type: 'p', text: '背景・前景・グリッチの三層に分けておくと、手数を増やさずに密度を上げられる。' },
  ]),
  post({ id: '7', index: '07', title: 'AI コーディングと向き合う', source: '静か', date: '2026-02-25', excerpt: '生成されたコードを「読む」技術が、書く技術より重くなった話。' }, [
    { type: 'h2', text: '書くから読むへ' },
    { type: 'p', text: 'コードを生み出すコストが下がった分、レビューと検証に時間が移った。重心が完全に変わった。' },
    { type: 'h2', text: 'ルールを資産にする' },
    { type: 'p', text: '繰り返し指摘することは rules や skills として外部化する。同じ指摘を二度しないための仕組みづくり。' },
    { type: 'h3', text: 'TDD の効きどころ' },
    { type: 'p', text: 'テストを先に書くと、生成コードの正しさを機械的に確かめられる。安心して任せられる範囲が広がる。' },
  ]),
  post({ id: '8', index: '08', title: 'Durable Object でリアルタイムカーソル', source: 'zenn', date: '2026-02-08', excerpt: '訪問者同士のカーソルを共有する小さな実験。' }, [
    { type: 'h2', text: 'プレゼンスの最小実装' },
    { type: 'p', text: '座標を投げて配るだけ。状態は持たず、接続が切れたら消える。それくらい軽い方が気持ちいい。' },
    { type: 'h2', text: 'ブロードキャストの間引き' },
    { type: 'p', text: '毎フレーム送ると帯域が溶ける。送信側で間引いて、受信側で補間する。' },
  ]),
  post({ id: '9', index: '09', title: 'グリッドの上で組版する', source: '静か', date: '2026-01-20', excerpt: '白を基調にしたグラフィックデザインの版面づくり。' }, [
    { type: 'h2', text: '余白を設計する' },
    { type: 'p', text: '要素を置く前に、置かない場所を決める。余白は引き算ではなく、最初に確保するものだ。' },
    { type: 'h2', text: '黒のグロテスクと青' },
    { type: 'p', text: '無彩色の中に一色だけエレクトリックブルーを差す。視線の落としどころを一点に絞る。' },
  ]),
  post({ id: '10', index: '10', title: 'oxlint への移行記', source: 'zenn', date: '2025-12-15', excerpt: 'ESLint から oxlint へ。速度と引き換えに失ったものと得たもの。' }, [
    { type: 'h2', text: '速度という福音' },
    { type: 'p', text: 'lint が一瞬で終わる。CI の待ち時間が消えると、commit のたびに走らせる習慣が戻ってくる。' },
    { type: 'h2', text: 'ルールの再設計' },
    { type: 'p', text: '使えるルールの集合が変わる。失われたルールは custom hook や review で補う方針にした。' },
  ]),
  post({ id: '11', index: '11', title: 'tsgo で型検査を速くする', source: 'zenn', date: '2025-11-28', excerpt: 'TypeScript native preview で typecheck を体感できる速さに。' }, [
    { type: 'h2', text: 'native preview とは' },
    { type: 'p', text: 'Go で書き直された TypeScript コンパイラ。型検査が桁違いに速くなる。' },
    { type: 'h2', text: '導入の注意点' },
    { type: 'p', text: 'まだ preview なので、エッジケースで挙動が分かれることがある。tsc と併走させて様子を見ている。' },
  ]),
];
