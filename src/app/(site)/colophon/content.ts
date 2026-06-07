// The colophon: this site's concept, its typography, its component catalog, and
// what it runs on. The design-system showcase, put into words and live demos.
export const colophon = {
  title: 'colophon',
  kicker: '// このサイトについて',
  lead: 'このサイト、こうやって作ってるんだよなぁ。コンセプトも部品も、ぜんぶここに置いとくね。',
  concept: {
    intro: 'このサイトのコンセプト、ひとことで言うと「白の上で、過剰をやる」なんだよなぁ。',
    points: [
      {
        term: '秩序を敷いて、過剰を盛る。',
        description: '方眼のグリッドで秩序を敷いて、その上に黒のグロテスク・エレクトリックブルー・等幅のシステム文字を過剰に重ねる。混沌と調和が同じ版面に乗ってる、その感じが好きなんだよなぁ。',
      },
      {
        term: '機械的なUIは、置かない。',
        description: '汎用のテンプレを当てはめた画面は作らない。情報ごとに「これは何で、どう伝わるべきか」を分解して、その答えに固有の UI を与える。道具がなければ、つくる。',
      },
      {
        term: '完成させない。作り直し続ける。',
        description: 'このサイトは「完成品」じゃなくて、ずっと rebuild され続けるもの。作り直すこと自体が、ぼくにとっては考える手段なんだよなぁ。だからここに書いてあることも、たぶんそのうち変わる。',
      },
    ],
  },
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
    // 周辺クローム — SiteShell が常時描いてるので、ここでは実物を指す(再描画しない)。
    ambient: [
      { label: 'いま囲ってる枠', target: 'TypographyBand' },
      { label: '背後で蠢くセル', target: 'GameOfLife' },
      { label: '上のヘッダー', target: 'SysBar' },
      { label: 'このページを包む殻', target: 'SiteShell' },
      { label: '上の見出しブロック', target: 'PageHeader' },
      { label: 'いちばん下のフッター', target: 'SiteFooter' },
    ],
    // フロー要素 — 生デモは _demos に置き、name で対応付ける。
    items: [
      { name: 'ScrambleText', why: 'hover すると文字がほどける。news / blog のタイトルに効かせてるんだよなぁ。' },
      { name: 'EchoText', why: '多層エコーの見出し。輪郭・青・本体を重ねて T2 みたいに光らせてる。' },
      { name: 'Marquee', why: '横に流れる帯。2トラックで継ぎ目なくループさせてるんだよなぁ。' },
      { name: 'Heading', why: '見出しのレベル。h1 / h2 はページと節に取ってあるから、ここは h3 以降。' },
      { name: 'SectionHeading', why: '番号付きの節見出し。mono の連番 + 2px の罫線で締めるんだよなぁ。' },
      { name: 'RichText', why: 'Payload の lexical を描く。見出し・引用・コード・リスト、ぜんぶこいつ。' },
      { name: 'Card', why: 'コンテンツの最小枠。as で中の要素を差し替えられるようにしてる。' },
      { name: 'Figure', why: '画像 + キャプション。比率を保ったまま枠に収める。' },
      { name: 'Gallery', why: 'タイル状の写真グリッド。クリックで lightbox が開くんだよなぁ。' },
      { name: 'Timeline', why: '年表。これからの予定だけ accent で立ててる。' },
      { name: 'Table', why: '素朴な表。caption 付きで event ログとかに使う。' },
      { name: 'List', why: '箇条書きと定義リスト。順序あり / なし両対応。' },
      { name: 'Badge', why: '状態の小札。now playing / rec / offline みたいなやつ。' },
      { name: 'Tag', why: '分類タグ。default / blue / outline の3トーン。' },
      { name: 'SystemAnnotation', why: 'mono の注釈。muted / accent / danger の3色で状態を喋らせてる。' },
      { name: 'Button', why: 'solid / outline / danger。react-aria ベースで触り心地を担保。' },
      { name: 'Link', why: 'リンク。tone と下線の有無を切り替えられる。' },
      { name: 'Divider', why: '区切り線。実線と破線を使い分けるんだよなぁ。' },
      { name: 'Pagination', why: 'ページ送り。URL の形は呼び出し側が持つ設計なんだよなぁ。' },
      { name: 'Breadcrumbs', why: 'パンくず。いまどの階層にいるかを辿れるようにする。' },
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
