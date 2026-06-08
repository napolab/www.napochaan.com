# Gallery blank（空きマス）の埋め方 — リファレンス調査

- 日付: 2026-06-08 / ブランチ: feat/gallery-page
- 目的: skyline masonry の blank（凸凹下端＋内部ギャップ）の "もっと良い" 扱い方をブレスト

## リサーチ要点

**Swiss（Müller-Brockmann）** — 余白は"活かす"もの。modular grid・非対称・左揃え・白の量で緊張を作る。→ 埋めない美学。

**Brutalism** — グリッドを"見せて壊す"。巨大タイポを構造として使い、セル境界を越えて overflow/overlap させる。mono・黒白灰。→ 今の「広告タイポ断ち落とし」がこれ。

**Masonry best practice** — `grid-auto-flow: dense` / look-ahead で**空白そのものを最小化**するのが定石。→ "埋め方" の前に "空白を減らす" 別解。

**技術図面（dimensioning ISO 129-1）** — 寸法線は本体より細く、対象に触れず offset。外形寸法→詳細の順。参照マーカー（⊕ / セクション記号）。→ design-direction の「座標・計測ノイズ」に最も忠実。void を"採寸"する発想。

**Y2K / maximalist** — clashing color・holographic・sticker/badge・barcode・青赤ブロック。→ 一番ポップで賑やか。

## 方向性 4 案

- **A. 寸法注釈（技術図面）** ⭐推奨: blank を"採寸"する。寸法線＋実寸（298×412 等）＋四隅の⊕レジストレーション＋参照番号 NO.07。mono・細線・抑制的。design-direction に最も忠実でユニーク。広告語より上品。
- **B. 余白を活かす（Swiss）**: ほぼ空。中央 or 隅に極小の十字＋mono 1行だけ。引き算。写真が主役に戻る。
- **C. 広告タイポ継続（Brutalist・現状）**: 巨大タイポ断ち落とし＋座標。賑やか・主張強い。さらに磨くなら回転/サイズ変化でリズム。
- **D. 空白を減らす（dense packing）**: skyline に look-ahead を入れて隙間を最小化 → blank はほぼ下端だけ → そこだけ軽い注釈。"埋める問題"自体を縮小。

## 出典

- Brutalist Web Design / Smashing「Styling Empty Cells with Generated Content」
- Swiss Style（Poster House / Wikipedia）/ Müller-Brockmann Grid Systems
- Masonry: DEV「Masonry with CSS grid」`grid-auto-flow: dense`
- Dimensioning ISO 129-1（Wikipedia / First in Architecture）
- Y2K: Pinterest「Y2K poster/layout design」boards

## 私の推し

**A（寸法注釈）を主軸**に、可能なら **D（packing 改善で blank を減らす）** を併用。理由: ① 広告語は手垢が付きやすいが「void を採寸する図面」はこのサイトの世界観固有で強い ② 抑制的なので写真を邪魔しない ③ D で blank が減れば、各 blank に手をかける価値も上がる。
