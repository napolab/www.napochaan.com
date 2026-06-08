// The colophon: this site's concept, its typography, its component catalog, and
// what it runs on. The design-system showcase, put into words and live demos.
export const colophon = {
  title: 'colophon',
  kicker: '// このサイトの作りかた',
  lead: 'このサイトがどう作られてるか、ぜんぶここに分解して並べた。思想から部品から土台まで、隠さず置いとくよ。',
  concept: {
    intro: 'コンセプトは「白の上で、過剰をやる」。製図みたいな方眼を一枚だけ敷いて、その秩序の上で好き放題やってる。',
    points: [
      {
        term: '白地に、黒で殴る。',
        description:
          '地は白〜淡グレーの方眼グリッド。その上に黒のグロテスク体を巨大に重ねて、歪んだ黒塊にして殴ってる。差し色はエレクトリックブルーが主、赤はごく少量。文字そのものを主役にするのが好きだ。',
      },
      {
        term: '機械が吐く文字を、装飾にする。',
        description: 'タイムスタンプ、座標、since 2020、gen / alive のカウンタ。等幅で吐き出されるシステム注釈を、そのまま画面のテクスチャに使ってる。あのデジタル・システム感が好きなんだと思う。',
      },
      {
        term: '背景は、動く計算機。',
        description: "方眼の上で Conway's Game of Life を明滅させてる。背景は止まった壁紙じゃなくて、ずっと計算し続けてる場所だよ。",
      },
      {
        term: '機械的なUIは、置かない。',
        description: 'テンプレをそのまま当てた画面は作らない。情報ごとに「これは何で、どう伝わるべきか」をいちど分解して、その答えに合う UI を一個ずつ与えてる。道具がなければ、つくる。',
      },
      {
        term: '完成させない。作り直し続ける。',
        description: 'このサイトは完成品じゃない。ずっと rebuild され続けるものだよ。作り直すこと自体が、ぼくにとっては考える手段なんだと思う。だからここに書いてあることも、たぶんそのうち変わる。',
      },
    ],
  },
  typography: {
    intro: '文字のサイズ、けっこう本気で決めてる。本文を基準に置いて、見出しは一気にジャンプさせてるよ。',
    scale: [
      { token: 'md', px: '16px', ratio: '1.00x', role: '本文' },
      { token: 'h3', px: '23px', ratio: '×1.44', role: '小見出し' },
      { token: 'h2', px: '28→33px', ratio: 'clamp 3.5vw', role: '節見出し' },
      { token: 'h1', px: '33→51px', ratio: 'clamp 5vw', role: 'ページ見出し' },
      { token: 'display', px: '56→96px', ratio: 'clamp 9vw', role: 'ディスプレイ' },
      { token: 'hero', px: '56→160px', ratio: 'clamp 15vw', role: 'ヒーロー' },
    ],
    fonts: [
      { family: 'digibop', role: 'display', why: '黒グロテスクの打撃力がすごい。見出しで殴る役。' },
      { family: 'M PLUS 1', role: 'body', why: '和文がちゃんと読める。next/font で安定して届くのも効いてる。' },
      { family: 'config-mono-vf', role: 'mono', why: 'システムの地の声。数値も注釈もコマンドも、ぜんぶこいつに喋らせてる。' },
    ],
    bandNote: 'いま画面の四辺を囲ってるこの枠、あれが TypographyBand だよ。',
  },
  components: {
    intro: 'このページ自体が design-system の上で動いてる。囲ってる枠も、背後で蠢く背景も、ヘッダーも、ぜんぶ部品でできてるんだ。',
    // 周辺クローム — SiteShell が常時描いてるので、ここでは実物を指す(再描画しない)。
    ambient: [
      { label: 'いま四辺を囲ってる枠', target: 'TypographyBand' },
      { label: '背後で蠢くセル', target: 'GameOfLife' },
      { label: '画面上のヘッダー', target: 'SysBar' },
      { label: 'このページを包む殻', target: 'SiteShell' },
      { label: '上の見出しブロック', target: 'PageHeader' },
      { label: 'いちばん下のフッター', target: 'SiteFooter' },
    ],
    // フロー要素 — 生デモは _demos に置き、name で対応付ける。
    items: [
      { name: 'ScrambleText', why: 'hover すると文字がほどけて組み直る。news / blog のタイトルに効かせてるやつ。' },
      { name: 'EchoText', why: '多層エコーの見出し。輪郭・青・本体を重ねて、T2 みたいに光らせてる。' },
      { name: 'Marquee', why: '横に流れる帯。2トラックで継ぎ目なくループさせてる。' },
      { name: 'Heading', why: '見出しのレベル本体。h1 / h2 はページと節に取ってあるから、ここは h3 以降。' },
      { name: 'SectionHeading', why: '番号付きの節見出し。mono の連番に 2px の罫線で締める。' },
      { name: 'RichText', why: 'Payload の lexical を描く係。見出し・引用・コード・リスト、ぜんぶこいつが面倒みてる。' },
      { name: 'PhrasedText', why: 'BudouX で日本語を文節ごとに折り返す。auto-phrase が効かない iOS でも改行位置がそろうやつ。' },
      { name: 'Card', why: 'コンテンツの最小枠。as で中の要素を差し替えられるようにしてあるよ。' },
      { name: 'Figure', why: '画像とキャプションのセット。比率を保ったまま枠に収める。' },
      { name: 'Gallery', why: 'タイル状の写真グリッド。クリックで lightbox が開く。' },
      { name: 'GalleryArchive', why: 'skyline で詰める可変メイソンリー。レイアウトは CSS(cqw/calc)だけで測定なし・無段差、空きマスは図面みたいに採寸して埋めてる。' },
      { name: 'Timeline', why: '年表。これからの予定だけ accent で立ててる。' },
      { name: 'Table', why: '素朴な表。caption 付きで、event ログとかに使ってる。' },
      { name: 'List', why: '箇条書きと定義リスト。順序あり / なし、どっちもいける。' },
      { name: 'Badge', why: '状態の小札。now playing / rec / offline みたいなやつ。' },
      { name: 'Tag', why: '分類タグ。default / blue / outline の3トーン。' },
      { name: 'SystemAnnotation', why: 'mono の注釈。muted / accent / danger の3色で状態を喋らせてる。' },
      { name: 'Button', why: 'solid / outline / danger の3種。react-aria ベースで触り心地を担保。' },
      { name: 'Link', why: 'リンク。tone と下線の有無を切り替えられる。' },
      { name: 'Divider', why: '区切り線。実線と破線を使い分けてる。' },
      { name: 'Pagination', why: 'ページ送り。URL の形は呼び出し側が持つ設計だよ。' },
      { name: 'Breadcrumbs', why: 'パンくず。いまどの階層にいるかを辿れるように。' },
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
