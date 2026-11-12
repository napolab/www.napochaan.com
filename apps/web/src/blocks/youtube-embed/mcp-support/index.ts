import { fenceOpeningLines } from '@lib/mcp/markdown/code-fences';

import { youtubeEmbedProvider } from '../embed-provider';

import type { McpBlockSupport } from '@lib/mcp/markdown/block-support';

// LLM 向けの構文説明。tool の bodyMarkdown 説明に集約される。
// youtube-embed の公開構文は標準 Markdown リンク行のみ(独自フェンスは公開しない)。
const syntaxHelp = [
  'YouTube 動画の埋め込み(標準 Markdown リンク構文):',
  '前後を空行にした単独行に YouTube 動画 URL だけを書くと埋め込みになる。',
  '[キャプション](URL) 形式ならキャプション付き埋め込み。',
  'URL は https の watch?v= / youtu.be / /embed/ のいずれか(11 文字の動画 ID)。',
  '文中のインラインリンクは通常のリンクのまま埋め込みにならない。例:',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  '',
  '[ライブ映像](https://youtu.be/dQw4w9WgXcQ)',
].join('\n');

// 廃止済みの旧内部フェンス構文の開始行。どの block plugin もこのフェンスを取り込まなく
// なった結果、素通しすると Code block の customStartRegex ```(\w+)? が行頭に部分一致して
// 「language: "youtube"(select 未対応)+ code 先頭に "-embed" が混入」という silent
// 破壊 + 不親切な Payload ValidationError になる(実測)。mcp-write-strict の方針どおり、
// Payload に届く前に回復指示つきで明示的に拒否する。
const LEGACY_FENCE_OPEN = /^```youtube-embed\s*$/;

const validateFences = (markdown: string): string[] =>
  fenceOpeningLines(markdown)
    .filter((line) => LEGACY_FENCE_OPEN.test(line))
    .map(
      (line) =>
        `\`\`\`youtube-embed フェンス構文は廃止されました。YouTube 埋め込みは前後を空行にした単独行の URL、またはキャプション付きなら [キャプション](URL)(標準 Markdown リンク構文)で書いてください。該当行: ${line}`,
    );

// MCP の markdown registry(src/lib/mcp/markdown)に登録する youtube-embed の plugin。
// linkEmbedProvider(../embed-provider)が公開リンク行 → block node の置き換えを担う —
// registry 側が全 block の provider を汎用 transform(@utils/lexical/link-embed)1 本に
// first-match 合成し、convertMarkdownToLexical 直後の tree に適用する。
// 埋め込みは URL しか参照しないため media id は列挙しない。
export const youtubeEmbedMcpSupport = {
  blockType: 'youtube-embed',
  syntaxHelp,
  validateFences,
  linkEmbedProvider: youtubeEmbedProvider,
  extractMediaIDs: (_markdown: string): number[] => [],
} satisfies McpBlockSupport;
