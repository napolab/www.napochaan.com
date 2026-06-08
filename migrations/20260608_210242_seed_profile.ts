import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-d1-sqlite'

import { richTextFromBlocks, richTextFromParagraphs } from '../src/utils/sample-rich-text'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // updateGlobal is naturally idempotent (singleton) — always run to ensure the profile is set.
  await payload.updateGlobal({
    slug: 'profile',
    data: {
      name: 'naporitan',
      aka: 'napochaan / naporin / @naporin24690',
      now: 'プログラマー / フルスタックエンジニア · DJ · VJ',
      team: 'StudioGnu',
      tagline: 'おそろしき、なんでも屋。',
      bio: richTextFromBlocks([
        { type: 'p', text: 'たぶん今もどっかで何か作ってる、naporitan です。リアルの会場か VRChat、そのどっちかで DJ か VJ をやってると思ってくれていいよ。両方が現場！' },
        {
          type: 'p',
          text: [
            '正体はプログラマで DJ で VJ。本業はソフトウェア開発で、ウェブサイト・Web アプリ・モバイルアプリをつくって運営してるぞ。クリエイター集団 ',
            { text: 'StudioGnu', href: 'https://studiognu.org', newTab: true },
            ' ではアーティストの 0 から 1 を技術で支えてる。',
          ],
        },
        {
          type: 'p',
          text: [
            'VJ 用のソフトは Electron + WebGPU で自分でつくった。道具がなければ、つくる。それと、イベントそのものを作るのが好き。主催してる VRDJ イベント「',
            { text: 'Booth²Booth', href: 'https://booth2booth.com', newTab: true },
            '」では、制作メンバーを集めて、世界観や HP をつくってる。今夜もどっかで動いてるから、見つけたら声かけてね〜！',
          ],
        },
      ]) as unknown as Record<string, unknown>,
      philosophy: richTextFromParagraphs([
        'ぼくは、見たものがどう作られているのかを分解したい。何かに触れると、それがどんな仕組みでできているのか知りたくなる。コードを読むのが好きだった。LLM の時代になって、その延長でプログラミングで何かを作ることが止まらなくなった。次から次へとアイデアが湧いてくる。技術を通して表現を見るのが好きだし、表現に向かい合うのが好き。何かを作り上げていく過程が好きで、作ったものに意味を持たせるのが好き。持たせようと考えることが好きだ。',
        'バグが好きだ。意図していないのに、何かを企んでいるように見える瞬間が好き。無邪気と不穏が、同じ場所に同居している。pixelsort や datamosh のような崩壊も、コラージュも、陰鬱なものも好き。混沌と調和、相反するものが同じ場所にあるものに惹かれる。',
        '物寂しさと陰鬱さが与える安心感、辛いという感情と生への実感。それらがぼくを構成する物だ。過去には戻れないという、後悔に塗れた感情もそこにある。後悔は、ずっとぼくの中にある。',
        '自分の感情が動いた時、それがどう動いたのかに興味がある。そして、自分以外の人の感情も動かしたい。',
        'ぼくは、ただ後悔したくないだけなのだと思う。戻れない過去をずっと抱えているから、これ以上は後悔したくない。そして同じことを、自分の周りにいる人にも思う。あの人たちにも、後悔してほしくない。今この瞬間があってよかったと、ぼくも、周りの人も、そう思えるなら。それが自分の力で少しでもできるなら、いつだってそうしたい。',
      ]) as unknown as Record<string, unknown>,
      love: ['dubstep', 'brostep', 'riddim', 'color bass', 'hi-tech', 'jersey club', 'hyperpop', 'jesus club', 'hyperflip', 'bairefunk'].map((v) => ({ value: v })),
      skillGroups: [
        { category: 'lang', items: ['TypeScript', 'Rust', 'Python', 'Ruby', 'Swift', 'C#', 'Haskell', 'WebAssembly'].map((v) => ({ value: v })) },
        { category: 'frontend', items: ['React', 'Next.js', 'Remix', 'CSS', 'vanilla-extract', 'React Native', 'Expo'].map((v) => ({ value: v })) },
        { category: 'backend', items: ['Hono', 'NestJS', 'GraphQL', 'Flask', 'FastAPI', 'Rails'].map((v) => ({ value: v })) },
        { category: 'infra', items: ['Cloudflare', 'Durable Objects', 'D1', 'R2', 'Firebase', 'Vercel'].map((v) => ({ value: v })) },
        { category: 'data', items: ['Yjs', 'Drizzle', 'Prisma', 'pandas', 'NumPy', 'scikit-learn'].map((v) => ({ value: v })) },
        { category: 'graphics', items: ['WebGPU', 'WGSL', 'Unity', 'UdonSharp'].map((v) => ({ value: v })) },
      ],
      contacts: [
        { label: 'x', handle: '@naporin24690', href: 'https://x.com/naporin24690' },
        { label: 'github', handle: 'naporin0624', href: 'https://github.com/naporin0624' },
        { label: 'mail', handle: 'contact@napochaan.com', href: 'mailto:contact@napochaan.com' },
      ],
      _status: 'published',
    },
  })
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // seed removal is manual
}
