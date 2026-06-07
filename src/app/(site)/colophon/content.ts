// The colophon: how this site is made (site philosophy), how its code is written
// (code philosophy), and what it runs on. Distilled from the project's own
// `.claude/rules/*` and design direction — these are the codified principles,
// put into words. Replaced/edited as the rules evolve.
export const colophon = {
  title: 'colophon',
  kicker: '// このサイトについて',
  lead: 'このサイト、こうやって作ってるんだよなぁ。設計も思想も、ぜんぶここに置いとくね。',
  site: [
    {
      term: '機械的なUIを、徹底的に避ける。',
      description:
        '汎用テンプレートを当てはめただけの画面は、一つもない。タグの一覧も、年表も、プロフィールも——同じ「リスト」でも、文脈が違えば形は違う。伝えたい情報ごとに「これは何で、どう伝わるべきか」を問い直し、その答えに固有のUIを与える。',
    },
    {
      term: '作り方には、順番がある。',
      description:
        'まず HTML と CSS だけで成立させる。足りなければ react-aria に頼る。それでも届かないなら、独自実装に逃げる前に「UI そのものを変える」提案をする。自前のコンポーネントは、最後の手段だ。',
    },
    {
      term: 'アクセシビリティは、最初の制約。',
      description: 'WCAG 2.1 AA は後付けの飾りじゃない。ランドマークと見出しの階層、誰にでも届くコントラスト——意味のある構造を、装飾より先に置く。',
    },
    {
      term: '意味から、組む。',
      description: '見た目の状態は data-* 属性に写し、スタイルは CSS 側に閉じる。色も余白もデザイントークンだけ。場当たりのインラインを禁じることで、デザインはシステムであり続ける。',
    },
    {
      term: 'デフォルトは、サーバー。',
      description: '画面はまずサーバーで描く。「use client」は、本当にインタラクションが要る最小の葉にだけ与える。動く部分を小さく切り出して、ページの大半をゼロ JS のまま届ける。',
    },
    {
      term: '見た目は、グリッドの上の過剰。',
      description: '白を地に、方眼、黒のグロテスク、エレクトリックブルー、等幅のシステム文字。秩序（グリッド）と過剰（maximalism）を同居させる。',
    },
    {
      term: 'そして、作り直し続ける。',
      description: 'このサイトは「完成品」じゃなく rebuild され続けるもの。作り直すという行為そのものが、ぼくにとっては考えるための手段だ。',
    },
  ],
  code: [
    {
      term: 'テストを、実装より先に書く。',
      description:
        'Red → Green → Refactor。失敗するテストで「何を作るか」を宣言し、最小のコードで通し、緑のまま整える。テストは後から確認する道具じゃなく、実行できる仕様でありドキュメントだ。だから依存は内部で new せず注入する——モックできない設計は、テストできない設計だ。',
    },
    {
      term: '状態を、書き換えない。',
      description: 'const だけ。let も forEach もミューテーションもない。更新はスプレッドで新しい値を作り、同じ入力なら同じ出力を返す純粋な関数を内側に積む。副作用は、いちばん外の縁に押し出す。',
    },
    {
      term: '関数は、一つのことだけをやる。',
      description: '大きな塊は信じない。小さく純粋な単位に割って、テストと実装を隣に置く。再エクスポートだけの barrel は作らない——どこから来た何なのかが、import の一行で追えること。',
    },
    {
      term: '命令と問い合わせを、混ぜない。',
      description: '状態を変える command は void を返し、データを返す query は副作用を持たず何度呼んでも同じ。一つの関数に両方を詰め込まない。',
    },
    {
      term: '型は、呼び出し側の都合に合わせて広げない。',
      description:
        '関数自身の視点で、必要なものだけを受け取る契約を書く。null は上流（CMS の NULL、API のワイヤ形式）の事情だから境界で ?? undefined に潰し、内側は「ある / ない」の一つだけで考える。any ではなく unknown、as ではなく satisfies、曖昧な真偽ではなく === の明示。',
    },
    {
      term: '分岐は、浅く、明示的に。',
      description:
        'ガード節で早く返す。状態は判別可能なユニオンにして switch で網羅し、コンパイラに抜けを見つけさせる。ネストが2段を超えたら関数を割る。else が深くなったら、それは設計が間違っているサインだ。',
    },
    {
      term: '読みやすさは、賢さより上位にある。',
      description: '半年後のぼくが読めないコードは、壊れているのと同じだ。',
    },
  ],
  typography: {
    intro: '文字の大きさ、けっこう本気で決めてるんだよなぁ。本文を基準にして、見出しは一気にジャンプさせてる。',
    scale: [
      { token: 'md', px: '16px', ratio: '1.00x', role: '本文' },
      { token: 'h3', px: '23px', ratio: '×1.44', role: '小見出し' },
      { token: 'h2', px: '28→33px', ratio: 'clamp 3.5vw', role: '節見出し' },
      { token: 'h1', px: '33→51px', ratio: 'clamp 5vw', role: 'ページ見出し' },
      { token: 'display', px: '56→96px', ratio: 'clamp 9vw', role: 'ディスプレイ' },
      { token: 'hero', px: '56→160px', ratio: 'clamp 15vw', role: 'ヒーロー' },
    ],
    fonts: [
      { family: 'digibop', role: 'display', why: '黒グロテスクの打撃力がすごい。見出しで殴る役なんだよなぁ。' },
      { family: 'M PLUS 1', role: 'body', why: '和文がちゃんと読める。next/font で安定して届くのも効いてる。' },
      { family: 'config-mono-vf', role: 'mono', why: 'システム文字の地の声。数値も注釈もコマンドも、ぜんぶこれで喋らせてる。' },
    ],
    bandNote: 'いま画面を囲ってるこの枠、あれが TypographyBand なんだよなぁ。',
  },
  components: {
    intro: 'このページ自体が design-system の上で動いてるんだよなぁ。囲ってる枠も、背景も、ヘッダーも、ぜんぶ部品でできてる。',
    ambient: [
      { label: 'いま囲ってる枠', target: 'TypographyBand' },
      { label: '背後で蠢くセル', target: 'GameOfLife' },
      { label: '上のヘッダー', target: 'SysBar' },
    ],
    items: [
      { name: 'ScrambleText', why: 'hover すると文字がほどける。news / blog のタイトルに効かせてるんだよなぁ。' },
      { name: 'Marquee', why: '横に流れる帯。2トラックで継ぎ目なくループさせてるんだよなぁ。' },
      { name: 'EchoText', why: '多層エコーの見出し。輪郭・青・本体を重ねて T2 みたいに光らせてる。' },
      { name: 'Timeline', why: '年表。これからの予定だけ accent で立ててるんだよなぁ。' },
      { name: 'Card', why: 'コンテンツの最小枠。as で中の要素を差し替えられるようにしてる。' },
      { name: 'SystemAnnotation', why: 'mono の注釈。muted / accent / danger の3色で状態を喋らせてるんだよなぁ。' },
    ],
  },
  stack: [
    { term: 'framework', description: 'Next.js · OpenNext · React 19 (RSC / ISR)' },
    { term: 'edge', description: 'Cloudflare Workers · Durable Objects · D1 · R2' },
    { term: 'cms', description: 'Payload CMS' },
    { term: 'ui', description: 'Panda CSS (strictTokens) · react-aria-components' },
    { term: 'quality', description: 'TypeScript (tsgo) · oxlint · oxfmt · vitest (browser mode)' },
  ],
  source: { label: 'repo', handle: 'napolab/www.napochaan.com', href: 'https://github.com/napolab/www.napochaan.com' },
} as const;
