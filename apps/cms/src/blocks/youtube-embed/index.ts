import { formatYouTubeEmbedMarkdown } from './markdown-format';
import { parseYouTubeVideoID } from './parse-url';

import type { Block, BlockJSX } from 'payload';

// Markdown との対応(非対称な点に注意):
//   - export(Lexical → Markdown)は下の jsx.export が公開リンク形式
//     (./markdown-format の formatYouTubeEmbedMarkdown)を書き出す。
//   - import(Markdown → Lexical)はこの block 定義では行わない。公開構文は標準
//     Markdown リンク行なので convertMarkdownToLexical には通常の paragraph として
//     入り、MCP write path が変換直後に lexical tree を走査して block node へ
//     置き換える(汎用 transform @utils/lexical/link-embed + ./embed-provider)。
// BlockJSX 型(payload 3.84.1)は import を必須にしているため、意図的に dead な
// スタブを置く: customStartRegex /^(?!)/ はどの行にもマッチせず($importMultiline の
// transformer 候補に載っても発火しない)、万一呼ばれても import は false を返す。
const youtubeLinkConverter: BlockJSX = {
  // (?!) は常に失敗する先読み — この block は Markdown import に参加しない。
  customStartRegex: /^(?!)/,
  export: ({ fields }) => {
    const url = typeof fields.url === 'string' ? fields.url : '';
    const caption = typeof fields.caption === 'string' ? fields.caption : '';

    return formatYouTubeEmbedMarkdown(url, caption);
  },
  import: () => false,
};

// YouTube 動画を 16:9 の iframe で埋め込む rich-text block。
// URL のみ必須、caption は任意(iframe title と figcaption を兼ねる)。
// converter は src/components/rich-text/converters/youtube-embed。
export const YouTubeEmbed = {
  slug: 'youtube-embed',
  labels: { singular: 'YouTube 埋め込み', plural: 'YouTube 埋め込み' },
  jsx: youtubeLinkConverter,
  fields: [
    {
      name: 'url',
      label: 'YouTube URL',
      type: 'text',
      required: true,
      admin: {
        description: 'https://www.youtube.com/watch?v=... / https://youtu.be/... / /embed/ を受け付けます。',
      },
      validate: (value: string | null | undefined, _options: unknown): true | string => {
        if (typeof value !== 'string' || value === '') return 'YouTube URL は必須です。';
        if (parseYouTubeVideoID(value) === undefined) return 'YouTube の動画 URL として解釈できません(watch?v=、youtu.be、/embed/ のいずれか)。';

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
