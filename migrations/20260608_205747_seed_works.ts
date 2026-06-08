import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-d1-sqlite'

import { richTextFromParagraphs } from '../src/utils/sample-rich-text'

const dirname = path.dirname(fileURLToPath(import.meta.url))

const ensureMedia = async (payload: MigrateUpArgs['payload'], alt: string, filename: string): Promise<number> => {
  const existing = await payload.find({ collection: 'media', where: { alt: { equals: alt } }, limit: 1 })
  const [first] = existing.docs
  if (first !== undefined) {
    return first.id as number
  }
  const filePath = path.resolve(dirname, '..', 'src', 'assets', filename)
  const created = await payload.create({ collection: 'media', data: { alt }, filePath })
  return created.id as number
}

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  const existing = await payload.find({ collection: 'works', limit: 1 })
  if (existing.docs.length > 0) return

  const mediaVrchatSquare = await ensureMedia(payload, 'vrchat-square', 'vrchat-square.jpg')
  const mediaVrchatWide = await ensureMedia(payload, 'vrchat-wide', 'vrchat-wide.jpg')
  const mediaVrchatGlitch = await ensureMedia(payload, 'vrchat-glitch', 'vrchat-glitch.jpg')
  const mediaFlyerBooth0523 = await ensureMedia(payload, 'flyer-booth-0523', 'flyer-booth-0523.jpg')
  const mediaFlyerBooth0424 = await ensureMedia(payload, 'flyer-booth-0424', 'flyer-booth-0424.jpg')
  const mediaVrchatAlice = await ensureMedia(payload, 'vrchat-alice', 'vrchat-alice.jpg')

  const worksData = [
    {
      no: '01',
      title: 'Booth² key visual',
      type: 'graphic',
      year: 2026,
      thumbnail: mediaVrchatSquare,
      description: 'Booth² のためのキービジュアル。グリッドの上に黒のグロテスクを叩き込み、エレクトリックブルーの矩形でリズムを刻んだ一枚。',
      body: richTextFromParagraphs([
        'Booth² のためのキービジュアル。グリッドの上に黒のグロテスクを叩き込み、エレクトリックブルーの矩形でリズムを刻んだ一枚。',
        '版面を方眼で分割し、余白と矩形の間（ま）だけで会場の鼓動を設計した、シリーズ全体の基準となるアートワーク。',
      ]),
    },
    {
      no: '02',
      title: 'light trails set',
      type: 'vj',
      year: 2026,
      thumbnail: mediaVrchatWide,
      description: 'テクノの四つ打ちに同期させた光跡のVJセット。残像を引きずるトレイルでフロアの体温を可視化した。',
      body: richTextFromParagraphs([
        'テクノの四つ打ちに同期させた光跡のVJセット。残像を引きずるトレイルでフロアの体温を可視化した。',
        'BPMをそのまま座標へ流し込み、エレクトリックブルーの線がフロアの熱量に応じて伸縮するようリアルタイムで制御した。',
      ]),
    },
    {
      no: '03',
      title: 'VRChat stage VJ set',
      type: 'vj',
      year: 2025,
      url: 'https://www.youtube.com/watch?v=booth2booth-vrchat-set',
      thumbnail: mediaVrchatGlitch,
      description: 'VRChat のステージで回した実験的VJセット。glitch とスキャンラインで仮想空間そのものを歪ませた。',
      body: richTextFromParagraphs([
        'VRChat のステージで回した実験的VJセット。glitch とスキャンラインで仮想空間そのものを歪ませた。',
        'ワールドのジオメトリへ直接映像を投げ込み、走査線のノイズで「仮想であること」そのものを演出に転化した試み。',
      ]),
    },
    {
      no: '04',
      title: 'midnight flyer 05.23',
      type: 'flyer',
      year: 2025,
      thumbnail: mediaFlyerBooth0523,
      description: '深夜帯のパーティ用フライヤー。モノクロのコントラストに蛍光ブルーの座標を一点だけ落として深夜の緊張感を作った。',
      body: richTextFromParagraphs([
        '深夜帯のパーティ用フライヤー。モノクロのコントラストに蛍光ブルーの座標を一点だけ落として深夜の緊張感を作った。',
        'タイムテーブルと会場情報を等幅フォントで淡々と組み、唯一の色点へ視線を集める告知物としてデザインした。',
      ]),
    },
    {
      no: '05',
      title: 'glitch study',
      type: 'graphic',
      year: 2025,
      thumbnail: mediaVrchatGlitch,
      description: 'データモッシュと走査線のグラフィック習作。意図的に壊した画素の中から新しい構図を拾い集めた。',
      body: richTextFromParagraphs([
        'データモッシュと走査線のグラフィック習作。意図的に壊した画素の中から新しい構図を拾い集めた。',
        '破綻したフレームを方眼に並べ直し、ノイズを構成要素として扱うグラフィックの語彙を探った連作習作。',
      ]),
    },
    {
      no: '06',
      title: 'night graphics vol.13',
      type: 'flyer',
      year: 2024,
      thumbnail: mediaFlyerBooth0424,
      description: '夜のグラフィックシリーズ第13弾。グリッドを基準線に、情報を等幅フォントで淡々と並べた告知フライヤー。',
      body: richTextFromParagraphs([
        '夜のグラフィックシリーズ第13弾。グリッドを基準線に、情報を等幅フォントで淡々と並べた告知フライヤー。',
        '回を重ねるごとに研いだ方眼レイアウトの型を踏襲し、出演者と時刻だけを主役に据えた静かな告知デザイン。',
      ]),
    },
    {
      no: '07',
      title: 'ALICE portrait series',
      type: 'graphic',
      year: 2024,
      thumbnail: mediaVrchatAlice,
      description: 'アバター ALICE のポートレートシリーズ。グレースケールの proof にグリッチを一筋走らせ、仮想の存在感を焼き付けた。',
      body: richTextFromParagraphs([
        'アバター ALICE のポートレートシリーズ。グレースケールの proof にグリッチを一筋走らせ、仮想の存在感を焼き付けた。',
        'コンタクトシート風の校正紙へ一点だけブルーのグリッチを差し、仮想の被写体に肉体の手触りを与えようとした連作。',
      ]),
    },
    {
      no: '08',
      title: 'neon grid flyer',
      type: 'flyer',
      year: 2023,
      thumbnail: mediaFlyerBooth0424,
      description: 'ネオングリッドのフライヤー。方眼の交点に光を宿らせ、地下のテクノの夜を一枚に閉じ込めた。',
      body: richTextFromParagraphs([
        'ネオングリッドのフライヤー。方眼の交点に光を宿らせ、地下のテクノの夜を一枚に閉じ込めた。',
        '黒地に引いた方眼の格子点だけをエレクトリックブルーで発光させ、地下フロアの暗さと熱を同居させた告知物。',
      ]),
    },
    {
      no: '09',
      title: 'techno set @ basement',
      type: 'vj',
      year: 2023,
      thumbnail: mediaVrchatWide,
      description: '地下のフロアで回したテクノセットのVJ。BPMに食らいつくストロボとワイドな映像で空間を縦に伸ばした。',
      body: richTextFromParagraphs([
        '地下のフロアで回したテクノセットのVJ。BPMに食らいつくストロボとワイドな映像で空間を縦に伸ばした。',
        '横長スクリーンへ縦方向のモーションを叩き込み、低い天井の地下空間を視覚的に引き延ばすことを狙ったライブ映像。',
      ]),
    },
    {
      no: '10',
      title: 'first booth² poster',
      type: 'graphic',
      year: 2022,
      thumbnail: mediaVrchatSquare,
      description: 'Booth² 最初のポスター。グリッドと黒のグロテスクという原型を、ここで初めて紙の上に定着させた。',
      body: richTextFromParagraphs([
        'Booth² 最初のポスター。グリッドと黒のグロテスクという原型を、ここで初めて紙の上に定着させた。',
        '後の全ビジュアルへ受け継がれる方眼と太いグロテスク書体の組み合わせを、最初に印刷物として確定させた起点。',
      ]),
    },
    {
      no: '11',
      title: 'warehouse VJ rig',
      type: 'vj',
      year: 2022,
      thumbnail: mediaVrchatGlitch,
      description: '倉庫レイヴ用に組んだVJリグ。glitch を主役に、剥き出しのコンクリートへ映像を直接叩きつけた。',
      body: richTextFromParagraphs([
        '倉庫レイヴ用に組んだVJリグ。glitch を主役に、剥き出しのコンクリートへ映像を直接叩きつけた。',
        'プロジェクションの歪みを逆手に取り、コンクリート壁の凹凸ごとグリッチの構成要素として取り込んだ即興リグ。',
      ]),
    },
    {
      no: '12',
      title: 'lockdown stream set',
      type: 'vj',
      year: 2021,
      thumbnail: mediaVrchatWide,
      description: 'ロックダウン下の配信用VJセット。無観客のフロアへ向けて、画面越しのテクノを途切れさせないために組んだ。',
      body: richTextFromParagraphs([
        'ロックダウン下の配信用VJセット。無観客のフロアへ向けて、画面越しのテクノを途切れさせないために組んだ。',
        '配信フレームに最適化した低帯域の映像設計で、画面の向こうのフロアと孤立した夜をつなぎ続けるために組み上げた。',
      ]),
    },
    {
      no: '13',
      title: 'zine cover 02',
      type: 'graphic',
      year: 2021,
      thumbnail: mediaVrchatAlice,
      description: '自主制作 zine の第2号カバー。等幅フォントとグリッドだけで、宅録テクノの手触りを表紙に翻訳した。',
      body: richTextFromParagraphs([
        '自主制作 zine の第2号カバー。等幅フォントとグリッドだけで、宅録テクノの手触りを表紙に翻訳した。',
        '装飾を削ぎ落とし、方眼とモノスペース書体という最小限の語彙で宅録の生々しさを誌面へ移し替えた表紙。',
      ]),
    },
    {
      no: '14',
      title: 'debut night flyer',
      type: 'flyer',
      year: 2020,
      thumbnail: mediaFlyerBooth0523,
      description: '初めて主催した夜のフライヤー。何も持たないまま、グリッドと黒一色だけで最初の告知を刷った。',
      body: richTextFromParagraphs([
        '初めて主催した夜のフライヤー。何も持たないまま、グリッドと黒一色だけで最初の告知を刷った。',
        '予算も機材もないなかで、方眼と一色刷りという制約そのものを様式に変え、最初のイベントを世に出した一枚。',
      ]),
    },
    {
      no: '15',
      title: 'since 2020 logo',
      type: 'graphic',
      year: 2020,
      thumbnail: mediaVrchatSquare,
      description: 'すべての起点になった "since 2020" ロゴ。矩形と等幅の数字だけで、これから続く活動の基準線を引いた。',
      body: richTextFromParagraphs([
        'すべての起点になった "since 2020" ロゴ。矩形と等幅の数字だけで、これから続く活動の基準線を引いた。',
        '矩形とモノスペースの数字という二要素のみで構成し、以後の全グラフィックの基準線となるアイデンティティを定義した。',
      ]),
    },
  ]

  for (const work of worksData) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await payload.create({ collection: 'works', data: { ...work, _status: 'published' } as any })
  }
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // seed removal is manual
}
