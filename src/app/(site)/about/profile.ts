import { richTextFromParagraphs } from '@utils/sample-rich-text';

// Real napochaan.com profile (source: docs/about.md) — replaced by a Payload
// `global(profile)` later.
export const profile = {
  name: 'naporitan',
  aka: 'napochaan / naporin / @naporin24690',
  now: 'プログラマー / フルスタックエンジニア · DJ · VJ',
  team: 'StudioGnu',
  tagline: 'おそろしき、なんでも屋。',
  bio: richTextFromParagraphs([
    'ぼくはプログラマで、DJ で、VJ。リアルの会場と VRChat を行き来している。',
    '本業はソフトウェア開発。ウェブサイト、Web アプリ、モバイルアプリの開発と運営を手がけ、クリエイター集団 StudioGnu では、アーティストの 0 から 1 を技術で支えている。',
    '並行して、リアルと VRChat の両方で DJ / VJ。自作の VJ ソフト（Electron + WebGPU）で映像を組み、フライヤー、動画、ポスターもつくる。主催する VRDJ イベント「Booth²Booth」では、グラフィックから映像、HP、世界観まで、体験のすべてを自分で組み立てている。',
  ]),
  philosophy: richTextFromParagraphs([
    '体験は、細部の調和でできている。フォント、色、導線、演出。そのすべてが噛み合ったとき、はじめて世界観が立ち上がる。だから、隅々まで手を入れる。',
    'DJ では、楽しさや面白さを、言葉にせずそのまま手渡す。VJ では、QR コードのスタンプやコメント、参加者に手渡す iPhone のカメラで、観る人ごと巻き込んでいく。なかでも、datamosh・pixelsort・pixelstretch による footage の「破壊」と再構築に、最も価値を置いている。',
    'プログラミングは、問題を解くための道具。コードは、書くより読む。結局ぼくがしているのは、接続だ。音と、映像と、人を、つなぐ。',
  ]),
  love: ['dubstep', 'brostep', 'riddim', 'color bass', 'hi-tech', 'jersey club', 'hyperpop', 'jesus club', 'hyperflip', 'bairefunk'],
  skillGroups: [
    { category: 'lang', items: ['TypeScript', 'Rust', 'Python', 'Ruby', 'Swift', 'C#', 'Haskell', 'WebAssembly'] },
    { category: 'frontend', items: ['React', 'Next.js', 'Remix', 'CSS', 'vanilla-extract', 'React Native', 'Expo'] },
    { category: 'backend', items: ['Hono', 'NestJS', 'GraphQL', 'Flask', 'FastAPI', 'Rails'] },
    { category: 'infra', items: ['Cloudflare', 'Durable Objects', 'D1', 'R2', 'Firebase', 'Vercel'] },
    { category: 'data', items: ['Yjs', 'Drizzle', 'Prisma', 'pandas', 'NumPy', 'scikit-learn'] },
    { category: 'graphics', items: ['WebGPU', 'WGSL', 'Unity', 'UdonSharp'] },
  ],
  contacts: [
    { label: 'x', handle: '@naporin24690', href: 'https://x.com/naporin24690' },
    { label: 'github', handle: 'naporin0624', href: 'https://github.com/naporin0624' },
    { label: 'mail', handle: 'contact@napochaan.com', href: 'mailto:contact@napochaan.com' },
  ],
} as const;
