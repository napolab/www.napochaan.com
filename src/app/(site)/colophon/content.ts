// The colophon: this site's concept, its typography, its component catalog, and
// what it runs on. The design-system showcase, put into words and live demos.
export const colophon = {
  title: 'colophon',
  kicker: '// How to build',
  // Displayed lead: a punchy hover-scramble tagline (see colophon page).
  lead: 'Are you really seeing me?',
  // The full descriptive sentence, kept for the page's meta description (SEO).
  description: 'Are you really seeing me?',
  concept: {
    intro:
      '被験者は、ぼく。これは自分のサイトに出てしまうクセを、そのまま書きつけた観察票だよ。主訴は「白の上で、過剰をやりたい」……ただそれだけ。製図みたいな方眼を一枚だけ敷いて、その秩序の上で好き放題やってる。以下、所見。',
    points: [
      {
        no: '所見 01',
        term: '白地に、黒で殴る。',
        description:
          '地はいつも白〜淡グレーの方眼。その上に黒のグロテスク体を巨大に重ねて、歪んだ黒塊にして殴ってる。差し色はエレクトリックブルーが主で、赤はごく少しだけ。色より先に、文字そのものを主役に立てたくなるんだよね。目指してるのは graphic-design poster のマキシマリズム、「this is my graphic vol.13」みたいなタイポの flyer、韓国のグラフィックデザインあたりの温度……あの過剰さに、ずっと憧れてる。',
      },
      {
        no: '所見 02',
        term: '機械の声を、装飾として聞く。',
        description:
          'タイムスタンプ、座標、since 2020、gen / alive のカウンタ。ふつうは隠す、機械が等幅で吐くシステム注釈を、ぼくは消さずにそのまま画面のテクスチャにしてしまう。あの地の声が、たぶんぼくには飾りに見えてるんだと思う。',
      },
      {
        no: '所見 03',
        term: '背景が、止まっていられない。',
        description:
          "方眼の上で Conway's Game of Life をずっと明滅させてる。貼って終わりの壁紙じゃなくて、裏でずっと計算し続けてる場所にしないと、どうも落ち着かないらしい。……まあ、reduced-motion を選んでる人の前では、ちゃんと静止するけどね。",
      },
      {
        no: '所見 04',
        term: '混沌と整列を、共存させる。',
        description:
          '整然と引いた方眼の上に、わざと glitch を落とす。混沌と整列が同じ画面に同居してる、その状態に惹かれるんだよね。ぼくはバグが好きで、意図してないのに何かを企んでるように見える瞬間が好き。pixelsort や datamosh みたいな崩壊も、無邪気と不穏が同じ場所にあるのも好き。だからぼくの glitch はこれ……hover で文字がほどけて組み直る ScrambleText、多層エコーで見出しを光らせる EchoText、lead を1文字ずつ打って・たまに打ち間違えて・悩んで・消して直す TypewriterText、フォーカスを囲んで回るマーチングアンツ、背景の Game of Life の明滅。方眼っていう秩序があるから、その上でいくら崩しても画面は壊れない。整列が、混沌を許してくれてる。',
      },
      {
        no: '所見 05',
        term: '過剰なのに、アクセシビリティは手放さない。',
        description:
          'ここがたぶん、いちばんのこだわり。これだけ盛っても WCAG 2.1 AA は守るし、コントラストは絶対に犠牲にしない。フォーカスリングは二機ある。reduced-motion のときは静的な 2px の破線（角丸なし）、motion-safe のときは同じ位置でマーチングアンツが四辺を回る。offset を揃えてあるから、減速設定に切り替えてもリングがズレない。背景の Game of Life も、同じ設定でちゃんと止まる。過剰さと「誰でも触れること」を両立できないなら、ぼくは過剰のほうを削る。',
      },
    ],
  },
  // フォント選定の基準（02 type セクションは廃止。基準だけここに残す）:
  //   - digibop (display): これを見つけてサイトの方向性が決まった。見出しの打撃力担当。
  //   - config-mono-vf (mono): システム系でいちばん好きなやつ。これを軸に据えた。
  //   - M PLUS 1 (body): 本文は「ちゃんと読める」が基準。和文の可読性を担保。
  components: {
    intro: 'このページ自体が design-system の上で動いてる。囲ってる枠も、背後で蠢く背景も、ヘッダーも、ぜんぶ部品でできてるんだ。',
    // 周辺クローム — SiteShell が常時描いてるので、ここでは実物を指す(再描画しない)。
    ambient: [
      { label: '画面上のヘッダー', target: 'SysBar' },
      { label: 'このページを包む殻', target: 'SiteShell' },
      { label: '上の見出しブロック', target: 'PageHeader' },
      { label: 'いちばん下のフッター', target: 'SiteFooter' },
      { label: 'フォント読込中の起動オーバーレイ', target: 'LoadingOverlay' },
      { label: '起動演出を待たせる土台', target: 'BootStatusProvider' },
    ],
    // フロー要素 — 生デモは _demos に置き、name で対応付ける。
    items: [
      { name: 'ScrambleText', why: 'hover すると文字がほどけて組み直る。news / blog のタイトルに効かせてるやつ。' },
      { name: 'EchoText', why: '多層エコーの見出し。輪郭・青・本体を重ねて、T2 みたいに光らせてる。' },
      { name: 'TypewriterText', why: 'lead を1文字ずつ打つやつ。たまに打ち間違えて、悩んで、消して直す。top も下層も、導入文ぜんぶこれで喋らせてる。' },
      { name: 'Marquee', why: '横に流れる帯。2トラックで継ぎ目なくループさせてる。' },
      { name: 'Heading', why: '見出しのレベル本体。h1 / h2 はページと節に取ってあるから、ここは h3 以降。' },
      { name: 'SectionHeading', why: '番号付きの節見出し。mono の連番に 2px の罫線で締める。' },
      { name: 'RichText', why: 'Payload の lexical を描く係。見出し・引用・コード・リスト、ぜんぶこいつが面倒みてる。' },
      { name: 'PhrasedText', why: 'BudouX で日本語を文節ごとに折り返す。auto-phrase が効かない iOS でも改行位置がそろうやつ。' },
      { name: 'Card', why: 'コンテンツの最小枠。as で中の要素を差し替えられるようにしてあるよ。' },
      { name: 'Figure', why: '画像とキャプションのセット。比率を保ったまま枠に収める。' },
      { name: 'Gallery', why: 'タイル状の写真グリッド。クリックで lightbox が開く。' },
      {
        name: 'GalleryArchive',
        why: 'skyline で詰める可変メイソン-リー。レイアウトは CSS(cqw/calc)だけで測定なし・無段差、空きマスは図面みたいに採寸して埋めてる。',
      },
      { name: 'Timeline', why: '年表。これからの予定だけ accent で立てて、各項目のタイトルは詳細ページや外部リンクへ飛べる。' },
      { name: 'Table', why: '素朴な表。caption 付きで、event ログとかに使ってる。' },
      { name: 'List', why: '箇条書きと定義リスト。順序あり / なし、どっちもいける。' },
      { name: 'Badge', why: '状態の小札。now playing / rec / offline みたいなやつ。' },
      { name: 'Tag', why: '分類タグ。default / blue / outline の3トーン。' },
      { name: 'SystemAnnotation', why: 'mono の注釈。muted / accent / danger の3色で状態を喋らせてる。' },
      { name: 'Button', why: 'solid / outline / danger の3種。react-aria ベースで触り心地を担保。' },
      { name: 'TextField', why: '単一行の入力欄。react-aria ベースの boxed hairline。focus で枠が電子ブルーに灯り、検証エラーは下にインラインで出る。' },
      { name: 'TextArea', why: '複数行の入力欄。TextField と同じ boxed hairline で、本文みたいな長文用。rows で高さを決める。' },
      { name: 'Link', why: 'リンク。tone と下線の有無を切り替えられる。' },
      { name: 'Divider', why: '区切り線。実線と破線を使い分けてる。' },
      { name: 'Pagination', why: 'ページ送り。URL の形は呼び出し側が持つ設計だよ。' },
      { name: 'Breadcrumbs', why: 'パンくず。いまどの階層にいるかを辿れるように。' },
      { name: 'FeedLink', why: 'RSS フィードへのリンク。一覧ページの PageHeader 直下に置いて、購読を促す。' },
      {
        name: 'DecodingSkeleton',
        why: '一覧ページの読み込み中に出すやつ。スピナーの代わりに、文字が復号されていく様子を mono グリフと青いキャレットで見せてる。',
      },
      {
        name: 'TypographyBand',
        why: '画面の四辺を時計回りに流れる銘の帯。スクロール速度で加速して、止まると 24px グリッドにスナップする。本来は viewport の縁に貼りつくけど、ここはミニフレームに切り出した版。',
      },
      { name: 'GameOfLife', why: '背景で明滅してる Conway のライフゲーム、その実物コンポーネントをそのまま枠に収めたやつ。独立した engine で動かしてるので、背景の gen カウンタには干渉しない。' },
      {
        name: 'CursorPresence',
        why: '同じページを見てる人のカーソル。実物の描画レイヤー(CursorLayer)そのままに、socket を張らないサンプル engine を差して動かしてる。engine が waypoint を投げ、レイヤー側の lerp がキビキビ補間する——本番と同じ経路。',
      },
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
