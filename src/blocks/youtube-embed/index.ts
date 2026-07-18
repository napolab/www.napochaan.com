import { parseYouTubeVideoID } from './parse-url';

import type { Block, BlockJSX } from 'payload';

// フェンス構文の唯一の定義元。同じ構文を 2 箇所の consumer が読む:
//   - 下の jsx.customStartRegex / customEndRegex(1 行アンカー — Payload は候補行を 1 行ずつ渡す)
//   - src/blocks/youtube-embed/mcp-support(全文検索)
// スラッグをハイフン付きにしてあるのは意図的で、Code block の customStartRegex
// ```(\w+)? が \w にハイフンを含まないため、この行に決してマッチしない
// (block plugin が互いの構文を知らずに済む境界線)。src/blocks/code/index.ts の
// customStartRegex に関するコメントも参照。
export const FENCE_START = /^```youtube-embed\s*$/;
export const FENCE_END = /^```\s*$/;

// フェンス本文を trim 済み・空行除去済みの行配列にする。block 定義の jsx.import(改行結合済み)
// と MCP 側のフェンス検証(全文書スキャン)の両方が使う。
export const fenceBodyLines = (inner: string): string[] =>
  inner
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

type YouTubeFields = { url: string; caption?: string };

// import ハンドラの入り口。行数と URL 形状を検証し、フェンスとして妥当な形だけを
// block field に変換する。1 行目 = URL(必須), 2 行目 = caption(任意), それ以外は false。
const parseFenceBody = (children: string): YouTubeFields | false => {
  const lines = fenceBodyLines(children);
  if (lines.length === 0 || lines.length > 2) return false;

  const [url, caption] = lines;
  if (url === undefined) return false;
  if (parseYouTubeVideoID(url) === undefined) return false;
  if (caption !== undefined && caption.length > 0) return { url, caption };

  return { url };
};

// CONFIRMED against @payloadcms/richtext-lexical 3.84.1 (image-row と同じ multiline-element 経路):
// export は文字列を返すとそのままフェンスとして出力される。import は children にフェンス本文
// (linesInBetween.join('\n').trim())が渡り、返り値は block の自前 field(id/blockType を含めない)。
const youtubeFenceConverter: BlockJSX = {
  customStartRegex: FENCE_START,
  customEndRegex: FENCE_END,
  export: ({ fields }) => {
    const url = typeof fields.url === 'string' ? fields.url : '';
    const caption = typeof fields.caption === 'string' ? fields.caption : '';
    const body = caption === '' ? url : `${url}\n${caption}`;

    return `\`\`\`youtube-embed\n${body}\n\`\`\``;
  },
  import: ({ children }) => parseFenceBody(children),
};

// YouTube 動画を 16:9 の iframe で埋め込む rich-text block。
// URL のみ必須、caption は任意(iframe title と figcaption を兼ねる)。
// converter は src/components/rich-text/converters/youtube-embed。
export const YouTubeEmbed = {
  slug: 'youtube-embed',
  labels: { singular: 'YouTube 埋め込み', plural: 'YouTube 埋め込み' },
  jsx: youtubeFenceConverter,
  fields: [
    {
      name: 'url',
      label: 'YouTube URL',
      type: 'text',
      required: true,
      admin: {
        description: 'https://www.youtube.com/watch?v=... / https://youtu.be/... / /embed/ / /shorts/ を受け付けます。',
      },
      validate: (value: string | null | undefined, _options: unknown): true | string => {
        if (typeof value !== 'string' || value === '') return 'YouTube URL は必須です。';
        if (parseYouTubeVideoID(value) === undefined) return 'YouTube の動画 URL として解釈できません(watch?v=、youtu.be、/embed/、/shorts/ のいずれか)。';

        return true;
      },
    },
    {
      name: 'caption',
      label: 'キャプション',
      type: 'text',
    },
  ],
} satisfies Block;
