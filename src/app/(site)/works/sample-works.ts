import flyerBooth0424 from '../_assets/flyer-booth-0424.jpg';
import flyerBooth0523 from '../_assets/flyer-booth-0523.jpg';
import vrchatAlice from '../_assets/vrchat-alice.jpg';
import vrchatGlitch from '../_assets/vrchat-glitch.jpg';
import vrchatSquare from '../_assets/vrchat-square.jpg';
import vrchatWide from '../_assets/vrchat-wide.jpg';

import { richTextFromParagraphs } from '@utils/sample-rich-text';

import type { WorkRow } from './_lib/work-row';

// Sample archive — replaced by Payload CMS in a later plan. Reuses the same
// design-system assets as the home teaser ledger. Spans 2020–2026 (since 2020)
// so the stacked-spine ledger has enough year groups to accumulate. Shared by
// both the index (`/works`) and the detail route (`/works/[id]`).
export const works: readonly WorkRow[] = [
  {
    id: '1',
    no: '01',
    title: 'Booth² key visual',
    type: 'graphic',
    year: 2026,
    thumbnail: { src: vrchatSquare.src, width: vrchatSquare.width, height: vrchatSquare.height },
    description: 'Booth² のためのキービジュアル。グリッドの上に黒のグロテスクを叩き込み、エレクトリックブルーの矩形でリズムを刻んだ一枚。',
    body: richTextFromParagraphs([
      'Booth² のためのキービジュアル。グリッドの上に黒のグロテスクを叩き込み、エレクトリックブルーの矩形でリズムを刻んだ一枚。',
      '版面を方眼で分割し、余白と矩形の間（ま）だけで会場の鼓動を設計した、シリーズ全体の基準となるアートワーク。',
    ]),
  },
  {
    id: '2',
    no: '02',
    title: 'light trails set',
    type: 'vj',
    year: 2026,
    thumbnail: { src: vrchatWide.src, width: vrchatWide.width, height: vrchatWide.height },
    description: 'テクノの四つ打ちに同期させた光跡のVJセット。残像を引きずるトレイルでフロアの体温を可視化した。',
    body: richTextFromParagraphs([
      'テクノの四つ打ちに同期させた光跡のVJセット。残像を引きずるトレイルでフロアの体温を可視化した。',
      'BPMをそのまま座標へ流し込み、エレクトリックブルーの線がフロアの熱量に応じて伸縮するようリアルタイムで制御した。',
    ]),
  },
  {
    id: '3',
    no: '03',
    title: 'VRChat stage VJ set',
    type: 'vj',
    year: 2025,
    thumbnail: { src: vrchatGlitch.src, width: vrchatGlitch.width, height: vrchatGlitch.height },
    description: 'VRChat のステージで回した実験的VJセット。glitch とスキャンラインで仮想空間そのものを歪ませた。',
    body: richTextFromParagraphs([
      'VRChat のステージで回した実験的VJセット。glitch とスキャンラインで仮想空間そのものを歪ませた。',
      'ワールドのジオメトリへ直接映像を投げ込み、走査線のノイズで「仮想であること」そのものを演出に転化した試み。',
    ]),
  },
  {
    id: '4',
    no: '04',
    title: 'midnight flyer 05.23',
    type: 'flyer',
    year: 2025,
    thumbnail: { src: flyerBooth0523.src, width: flyerBooth0523.width, height: flyerBooth0523.height },
    description: '深夜帯のパーティ用フライヤー。モノクロのコントラストに蛍光ブルーの座標を一点だけ落として深夜の緊張感を作った。',
    body: richTextFromParagraphs([
      '深夜帯のパーティ用フライヤー。モノクロのコントラストに蛍光ブルーの座標を一点だけ落として深夜の緊張感を作った。',
      'タイムテーブルと会場情報を等幅フォントで淡々と組み、唯一の色点へ視線を集める告知物としてデザインした。',
    ]),
  },
  {
    id: '5',
    no: '05',
    title: 'glitch study',
    type: 'graphic',
    year: 2025,
    thumbnail: { src: vrchatGlitch.src, width: vrchatGlitch.width, height: vrchatGlitch.height },
    description: 'データモッシュと走査線のグラフィック習作。意図的に壊した画素の中から新しい構図を拾い集めた。',
    body: richTextFromParagraphs([
      'データモッシュと走査線のグラフィック習作。意図的に壊した画素の中から新しい構図を拾い集めた。',
      '破綻したフレームを方眼に並べ直し、ノイズを構成要素として扱うグラフィックの語彙を探った連作習作。',
    ]),
  },
  {
    id: '6',
    no: '06',
    title: 'night graphics vol.13',
    type: 'flyer',
    year: 2024,
    thumbnail: { src: flyerBooth0424.src, width: flyerBooth0424.width, height: flyerBooth0424.height },
    description: '夜のグラフィックシリーズ第13弾。グリッドを基準線に、情報を等幅フォントで淡々と並べた告知フライヤー。',
    body: richTextFromParagraphs([
      '夜のグラフィックシリーズ第13弾。グリッドを基準線に、情報を等幅フォントで淡々と並べた告知フライヤー。',
      '回を重ねるごとに研いだ方眼レイアウトの型を踏襲し、出演者と時刻だけを主役に据えた静かな告知デザイン。',
    ]),
  },
  {
    id: '7',
    no: '07',
    title: 'ALICE portrait series',
    type: 'graphic',
    year: 2024,
    thumbnail: { src: vrchatAlice.src, width: vrchatAlice.width, height: vrchatAlice.height },
    description: 'アバター ALICE のポートレートシリーズ。グレースケールの proof にグリッチを一筋走らせ、仮想の存在感を焼き付けた。',
    body: richTextFromParagraphs([
      'アバター ALICE のポートレートシリーズ。グレースケールの proof にグリッチを一筋走らせ、仮想の存在感を焼き付けた。',
      'コンタクトシート風の校正紙へ一点だけブルーのグリッチを差し、仮想の被写体に肉体の手触りを与えようとした連作。',
    ]),
  },
  {
    id: '8',
    no: '08',
    title: 'neon grid flyer',
    type: 'flyer',
    year: 2023,
    thumbnail: { src: flyerBooth0424.src, width: flyerBooth0424.width, height: flyerBooth0424.height },
    description: 'ネオングリッドのフライヤー。方眼の交点に光を宿らせ、地下のテクノの夜を一枚に閉じ込めた。',
    body: richTextFromParagraphs([
      'ネオングリッドのフライヤー。方眼の交点に光を宿らせ、地下のテクノの夜を一枚に閉じ込めた。',
      '黒地に引いた方眼の格子点だけをエレクトリックブルーで発光させ、地下フロアの暗さと熱を同居させた告知物。',
    ]),
  },
  {
    id: '9',
    no: '09',
    title: 'techno set @ basement',
    type: 'vj',
    year: 2023,
    thumbnail: { src: vrchatWide.src, width: vrchatWide.width, height: vrchatWide.height },
    description: '地下のフロアで回したテクノセットのVJ。BPMに食らいつくストロボとワイドな映像で空間を縦に伸ばした。',
    body: richTextFromParagraphs([
      '地下のフロアで回したテクノセットのVJ。BPMに食らいつくストロボとワイドな映像で空間を縦に伸ばした。',
      '横長スクリーンへ縦方向のモーションを叩き込み、低い天井の地下空間を視覚的に引き延ばすことを狙ったライブ映像。',
    ]),
  },
  {
    id: '10',
    no: '10',
    title: 'first booth² poster',
    type: 'graphic',
    year: 2022,
    thumbnail: { src: vrchatSquare.src, width: vrchatSquare.width, height: vrchatSquare.height },
    description: 'Booth² 最初のポスター。グリッドと黒のグロテスクという原型を、ここで初めて紙の上に定着させた。',
    body: richTextFromParagraphs([
      'Booth² 最初のポスター。グリッドと黒のグロテスクという原型を、ここで初めて紙の上に定着させた。',
      '後の全ビジュアルへ受け継がれる方眼と太いグロテスク書体の組み合わせを、最初に印刷物として確定させた起点。',
    ]),
  },
  {
    id: '11',
    no: '11',
    title: 'warehouse VJ rig',
    type: 'vj',
    year: 2022,
    thumbnail: { src: vrchatGlitch.src, width: vrchatGlitch.width, height: vrchatGlitch.height },
    description: '倉庫レイヴ用に組んだVJリグ。glitch を主役に、剥き出しのコンクリートへ映像を直接叩きつけた。',
    body: richTextFromParagraphs([
      '倉庫レイヴ用に組んだVJリグ。glitch を主役に、剥き出しのコンクリートへ映像を直接叩きつけた。',
      'プロジェクションの歪みを逆手に取り、コンクリート壁の凹凸ごとグリッチの構成要素として取り込んだ即興リグ。',
    ]),
  },
  {
    id: '12',
    no: '12',
    title: 'lockdown stream set',
    type: 'vj',
    year: 2021,
    thumbnail: { src: vrchatWide.src, width: vrchatWide.width, height: vrchatWide.height },
    description: 'ロックダウン下の配信用VJセット。無観客のフロアへ向けて、画面越しのテクノを途切れさせないために組んだ。',
    body: richTextFromParagraphs([
      'ロックダウン下の配信用VJセット。無観客のフロアへ向けて、画面越しのテクノを途切れさせないために組んだ。',
      '配信フレームに最適化した低帯域の映像設計で、画面の向こうのフロアと孤立した夜をつなぎ続けるために組み上げた。',
    ]),
  },
  {
    id: '13',
    no: '13',
    title: 'zine cover 02',
    type: 'graphic',
    year: 2021,
    thumbnail: { src: vrchatAlice.src, width: vrchatAlice.width, height: vrchatAlice.height },
    description: '自主制作 zine の第2号カバー。等幅フォントとグリッドだけで、宅録テクノの手触りを表紙に翻訳した。',
    body: richTextFromParagraphs([
      '自主制作 zine の第2号カバー。等幅フォントとグリッドだけで、宅録テクノの手触りを表紙に翻訳した。',
      '装飾を削ぎ落とし、方眼とモノスペース書体という最小限の語彙で宅録の生々しさを誌面へ移し替えた表紙。',
    ]),
  },
  {
    id: '14',
    no: '14',
    title: 'debut night flyer',
    type: 'flyer',
    year: 2020,
    thumbnail: { src: flyerBooth0523.src, width: flyerBooth0523.width, height: flyerBooth0523.height },
    description: '初めて主催した夜のフライヤー。何も持たないまま、グリッドと黒一色だけで最初の告知を刷った。',
    body: richTextFromParagraphs([
      '初めて主催した夜のフライヤー。何も持たないまま、グリッドと黒一色だけで最初の告知を刷った。',
      '予算も機材もないなかで、方眼と一色刷りという制約そのものを様式に変え、最初のイベントを世に出した一枚。',
    ]),
  },
  {
    id: '15',
    no: '15',
    title: 'since 2020 logo',
    type: 'graphic',
    year: 2020,
    thumbnail: { src: vrchatSquare.src, width: vrchatSquare.width, height: vrchatSquare.height },
    description: 'すべての起点になった "since 2020" ロゴ。矩形と等幅の数字だけで、これから続く活動の基準線を引いた。',
    body: richTextFromParagraphs([
      'すべての起点になった "since 2020" ロゴ。矩形と等幅の数字だけで、これから続く活動の基準線を引いた。',
      '矩形とモノスペースの数字という二要素のみで構成し、以後の全グラフィックの基準線となるアイデンティティを定義した。',
    ]),
  },
];
