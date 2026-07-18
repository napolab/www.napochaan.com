import { CodeBlock } from '@payloadcms/richtext-lexical';

import type { Block } from 'payload';

// language select のキーと表示ラベル。キーは frontend の Shiki highlighter
// (src/components/rich-text/converters/code/highlighter)が preload している
// 言語セットと 1:1 で揃えること — ここに無い言語はハイライトされず plain text に
// フォールバックする。MCP 側の言語キー検証(./mcp-support)もこの定義を参照する。
export const CODE_LANGUAGES = {
  typescript: 'TypeScript',
  tsx: 'TSX',
  css: 'CSS',
  json: 'JSON',
  bash: 'Bash',
} satisfies Record<string, string>;

// Payload 純正の premade Code block(slug 'Code', fields: language + code)。
// 標準 Markdown の ```lang フェンスを往復する jsx converter を内蔵しているため、
// image-row と違いフェンス構文の自前定義は持たない。ただし内蔵 converter の
// customStartRegex(```(\w+)?)は ```image-row の行頭にも部分一致するので、
// BlocksFeature への登録順は必ず ImageRow → Code にすること
// (src/lib/payload/editor-features 参照)。
export const Code: Block = CodeBlock({
  languages: CODE_LANGUAGES,
  defaultLanguage: 'typescript',
  fieldOverrides: {
    labels: { singular: 'コード', plural: 'コード' },
  },
});
