import { richTextFromBlocks, richTextFromParagraphs } from '@utils/sample-rich-text';

// Real napochaan.com profile (source: docs/about.md) — replaced by a Payload
// `global(profile)` later.
export const profile = {
  name: 'naporitan',
  aka: 'napochaan / naporin / @naporin24690',
  now: 'プログラマー / フルスタックエンジニア · DJ · VJ',
  team: 'StudioGnu / Booth²Booth',
  tagline: 'おそろしき、なんでも屋。',
  bio: richTextFromBlocks([
    {
      type: 'p',
      text: [
        'たぶん今もどっかで何か作ってる、naporitan です。だらだら、ぷらぷら、その場のノリだけで会話する刹那的な生物。',
        { br: true },
        'リアルの会場か VRChat、どっちかで DJ か VJ やってる。両方が現場！',
      ],
    },
    {
      type: 'p',
      text: [
        '正体はプログラマで DJ で VJ。本業はソフトウェア開発。',
        { br: true },
        'でもプログラミングは問題解決の道具で、それだけじゃ人に何かを渡せない。だからフライヤーも DJ も VJ もやる。ビジュアルでまるごと人を動かしにいく！',
      ],
    },
    {
      type: 'p',
      text: [
        '殻を破りたくて、クリエイター集団 ',
        { text: 'StudioGnu', href: 'https://studiognu.org', newTab: true },
        ' に飛び込んだ。今はアーティストの 0 → 1 を技術でガッツリ支えてる。',
        { br: true },
        'VJ ソフトは Electron + WebGPU で自作した。道具がなければ、つくる。',
        { br: true },
        '主催してる定期 DJ イベント「',
        { text: 'Booth²Booth', href: 'https://booth2booth.com', newTab: true },
        '」は、回を重ねながらものをつくっていく制作チームでもある。世界観から HP まで、まるっと自分たちで。気づけばなんでも自分でつくってる。見つけたら声かけてね〜！',
      ],
    },
  ]),
  philosophy: richTextFromParagraphs([
    '目に見えるもの全部を作りたい……本当は、そう思ってる。なにかに触れると、それがどんな仕組みでできているのか知りたくなって、すぐに分解したくなる。コードを読むのが好きだった。それがそのまま手を動かす方に転がって、LLM の時代になってからは、もう作るのが止まらない。次から次へとアイデアが湧いてきて、作ったものにどう意味を持たせようか、ずっと考えてる。たぶんぼくは、作っていない自分にうまく価値を感じられなくて……作り続けることだけが、ちゃんと呼吸できる方法なんだと思う。',
    'その延長で、バグが好きになった。意図していないはずなのに、なにかを企んでいるように見える瞬間。無邪気と不穏が、同じ場所に平気で同居している。pixelsort や datamosh みたいな崩壊も、コラージュも、陰鬱なものも、たぶん同じ理由で惹かれてる。混沌と調和、相反するものがひとつの場所に居座っているもの……ぼくはきっと、そういうものにしか本気で心を動かされない。',
    'それは、ぼく自身がそういう作りをしているからだと思う。物寂しさや陰鬱さが、なぜか安心感をくれる。辛いという感情があるからこそ、生きている実感がある。矛盾しているけど、その矛盾ごとがぼくを構成している。過去には戻れないという、後悔に塗れた感情も、ずっとそこにある。後悔は、たぶんこの先も消えない。',
    'だから、自分の感情が動いた時、それがどう動いたのかをいつも知りたくなる。仕組みがわかると、今度はそれを、自分以外の人にも起こしてみたくなる。プログラミングだけでは届かなかったものが、ビジュアルでなら届く気がしてる。結局ぼくは、ただ後悔したくないだけなんだと思う。戻れない過去を抱えているぶん、これ以上は後悔したくないし、同じことを周りの人にも思ってる。今この瞬間があってよかったと、ぼくも、あの人たちも、そう思えるなら。それが自分の力で少しでもできるなら、いつだってそうしたい。',
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
