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
      '被験者は、ぼく。これは前のサイトを壊して作り直したときの観察票だよ。前のはよくできてた……情報は整理されて、導線は通って、引っかかるところがどこにもない。でも開くたびに、他人の作ったものを褒める言い方で「よくできてるね」と思って、それで終わってた。主訴は「矛盾を、矛盾のまま置いておける場所がほしい」。以下、所見。',
    points: [
      {
        no: '所見 01',
        term: '矛盾を、矛盾のまま置く。',
        description:
          'ぼくが本気で心を動かされるのは、相反するものが平気で同居してるものだけなんだよね。OS を壊すウイルスが吐く映像の、恐怖と無邪気が混ざった感じ。物寂しいのに安心する、辛いのにそこにしか生きてる実感がない、みたいな。前のサイトはそういう「途中の、崩れたままの状態」がどこにも残ってなくて、論理的に置き直したあとの形だけでできてた。だからここは、矛盾を分解して片付けずに、そのまま画面に置いておく場所にした。',
      },
      {
        no: '所見 02',
        term: '好みは、暴かせた。',
        description:
          '作り直すとき、普段のぼくなら絶対やらないことをした。コンセプトを、自分で言語化しなかったんだ。LLM に「質問を繰り返して、ぼくの好みを暴いていきましょう」と投げて、出てきた断片に反射だけで「これすごい好き」と返していく。自分の口から出た言葉より、反射で選んだ断片のほうが、ぼくの好みをずっとよく説明してた。デザインでいちばん大事なのは対象の探索——知って、物語を知って、なりきる。いつも他人にやってるそれを、今回はぼくに向けてやった。',
      },
      {
        no: '所見 03',
        term: '全部に、名前がついてしまう。',
        description:
          'おかしいのは、反射で選んだはずの断片を前にしても、気づくと分類してることだ。殴り書きのタイポ、記号に崩れてまた戻ってくる glitch、機械が等幅で淡々と吐くシステム注釈——タイムスタンプ、座標、since 2020、gen / alive のカウンタ。混沌のつもりで集めたものが、手元ではもう一個ずつ役割を持った部品になってる。どこに何があって、なぜそうなるか、全部見えて、全部に名前がつく。その明晰さは便利で、ときどき少しだけしんどい。だから普段のぼくはおちゃらけてる。陽気な被膜を一枚かぶせてるんだ。',
      },
      {
        no: '所見 04',
        term: '単純な規則が、生命に見える。',
        description:
          "いちばん下に方眼を敷いて、その上で Conway's Game of Life をずっと明滅させてる。セルは隣にいくつ仲間がいるか数えて、生きるか死ぬか決めるだけ。近くで見れば1マスぶんの移動でしかないのに、引いて全体を眺めると、意味を持った生き物に見えてくる。あの落差がずっと好きだった。サイトの部品もぜんぶそう——ScrambleText、EchoText、TypewriterText、マーチングアンツ、誰かのカーソル。単体ならなんてことない仕掛けが、それぞれ勝手なライフサイクルで動いて重なると、画面はひどく複雑に見えてくる。紐解けばシンプルなのにね。……まあ、reduced-motion を選んでる人の前では、ちゃんと静止するけど。",
      },
      {
        no: '所見 05',
        term: '枠が固いほど、崩せる。',
        description:
          '崩すために作ったサイトなのに、足元は選べる中でいちばん厳密な枠でできてる。色も余白も Panda CSS の strictTokens を通さないと触れないし、インタラクションの足場は react-aria-components。矛盾して見えるかもだけど、枠が固いほど、その上で安心して崩せる。方眼と同じ理屈だ。ひとつだけ崩すことより優先したのがアクセシビリティ。color token は WCAG 2.1 AA を満たすように設計してあるから、どのページでどれだけ盛ってもコントラストは自動的に守られる。フォーカスリングは reduced-motion なら静的な破線、motion-safe ならマーチングアンツが回る。崩したくて作ってるのに、その崩し方で誰かを置き去りにしたら、それはただ閉じてるだけだから。',
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
      { label: 'iOS のステータスバー裏を追いかけて染める帯', target: 'SafeAreaTint' },
      { label: '上の見出しブロック', target: 'PageHeader' },
      { label: 'いちばん下のフッター', target: 'SiteFooter' },
      { label: '起動演出を待たせる土台', target: 'BootStatusProvider' },
      { label: 'アニメーションの on/off を束ねる土台（ヘッダーの motion トグル）', target: 'MotionProvider' },
      { label: 'works・blog 詳細の背後に敷くサムネイルのぼかし', target: 'AmbientBackdrop' },
    ],
    // フロー要素 — 生デモは _demos に置き、name で対応付ける。
    items: [
      { name: 'ScrambleText', why: 'hover すると文字がほどけて組み直る。news / blog のタイトルに効かせてるやつ。' },
      { name: 'EchoText', why: '多層エコーの見出し。輪郭・青・本体を重ねて、T2 みたいに光らせてる。' },
      { name: 'TypewriterText', why: 'lead を1文字ずつ打つやつ。たまに打ち間違えて、悩んで、消して直す。top も下層も、導入文ぜんぶこれで喋らせてる。' },
      { name: 'Marquee', why: '横に流れる帯。2トラックで継ぎ目なくループさせてる。' },
      { name: 'Heading', why: '見出しのレベル本体。h1 / h2 はページと節に取ってあるから、ここは h3 以降。' },
      { name: 'SectionHeading', why: '番号付きの節見出し。mono の連番に 2px の罫線で締める。' },
      { name: 'RichText', why: 'Payload の lexical を描く係。見出し・引用・コード・リスト・画像（単体／横並び）、ぜんぶこいつが面倒みてる。' },
      { name: 'PhrasedText', why: 'BudouX で日本語を文節ごとに折り返す。auto-phrase が効かない iOS でも改行位置がそろうやつ。' },
      { name: 'Card', why: 'コンテンツの最小枠。as で中の要素を差し替えられるようにしてあるよ。' },
      { name: 'Figure', why: '画像とキャプションのセット。比率を保ったまま枠に収める。' },
      { name: 'Gallery', why: 'タイル状の写真グリッド。クリックで lightbox が開く。' },
      {
        name: 'GalleryArchive',
        why: 'skyline で詰める可変メイソン-リー。でも画面の幅は測ってなくて、「列1本ぶん=1」の相対の比だけで配置を解いてる。実寸に直すのは最後に CSS(cqw/calc)の係。だからクライアント JS ゼロ、測定ゼロ、段差ゼロ。',
      },
      { name: 'Timeline', why: '年表。これからの予定だけ accent で立てて、各項目のタイトルは詳細ページや外部リンクへ飛べる。' },
      {
        name: 'NewsRow',
        why: 'お知らせ1件分の行。date · タグ · タイトルを方眼の3カラムに揃える。トップの news フィードと /news の一覧で共用してて、href 無しはプレーン、外部リンクは別タブ + ↗ で開く。',
      },
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
      { name: 'ShareBar', why: '記事末尾の共有バー。X(Twitter)の web intent と、リンクをクリップボードへコピーする2アクション。Instagram は URL 共有導線が無いので置いてない。' },
      { name: 'quoteShare', why: '本文を選択すると、その一節への text-fragment 深リンクのコピーと X 引用を選択範囲の上の Popover で出す（PC のみ）。' },
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
      {
        name: 'LoadingOverlay',
        why: 'フォント読込中の起動オーバーレイ。本来は全画面を覆う fixed だけど、ここは枠に収めた版。問いかけを typewriter で次々と。',
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
