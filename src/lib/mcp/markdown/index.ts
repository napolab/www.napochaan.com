import { convertLexicalToMarkdown, convertMarkdownToLexical } from '@payloadcms/richtext-lexical';

import { imageRowMcpSupport } from '../../../blocks/image-row/mcp-support';
import { videoMcpSupport } from '../../../blocks/video/mcp-support';

import type { McpBlockSupport } from './block-support';
import type { SanitizedServerEditorConfig } from '@payloadcms/richtext-lexical';
import type { Blog } from '@payload-types';

export type MarkdownCodec = {
  toLexical: (markdown: string) => Blog['body'];
  toMarkdown: (data: Blog['body']) => string;
};

// editorConfig はプロジェクトの root lexical editor 設定(BlocksFeature([ImageRow]) 込み)を
// 渡すこと(呼び出し側の責務)。route.ts で
// `editorConfigFactory.fromFeatures({ config, features: blogEditorFeatures })` から解決する。
// NG: `editorConfigFactory.default` は汎用 default editor で block 未登録。
// NG: `payload.config.editor.editorConfig` は payload.config 側の lexical コピー製で、
//     ここの convertLexicalToMarkdown が使う lexical コピーと ServerBlockNode が一致せず
//     「multiple copies of lexical」で block 変換が throw する。詳細は
//     src/lib/payload/editor-features/index.ts を参照。
export const createMarkdownCodec = (editorConfig: SanitizedServerEditorConfig): MarkdownCodec => ({
  toLexical: (markdown) => convertMarkdownToLexical({ editorConfig, markdown }),
  toMarkdown: (data) => convertLexicalToMarkdown({ editorConfig, data }),
});

// MCP が Markdown ⇔ Lexical を往復できる block の registry。増えたら block 側に
// plugin(McpBlockSupport)を書いてここに登録する。block 追加時にこのファイルに
// 増えるのは import 1 行と blockSupports への登録 1 行だけで、分岐やロジックは
// 増えない。fan-out 集約 — 全 plugin を毎回実行し結果を連結する(Payload 自身の
// markdown transformer は jsx.customStartRegex で first-match dispatch 済みなので、
// この層で二重にやる必要はない)。
const blockSupports: readonly McpBlockSupport[] = [imageRowMcpSupport, videoMcpSupport];

const SUPPORTED_BLOCK_TYPES = blockSupports.map((plugin) => plugin.blockType);

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

// node.fields は Payload 生成型では index signature 越しの unknown。
// レコードとして narrowing した上で blockType(string)だけを取り出す。
const blockTypeOf = (fields: unknown): string => {
  if (!isRecord(fields)) return '';
  const { blockType } = fields;
  return typeof blockType === 'string' ? blockType : '';
};

// node.children も同様に index signature 越しの unknown。配列でなければ子なし扱い。
const childrenOf = (children: unknown): unknown[] => (Array.isArray(children) ? children : []);

const containsUnsupportedBlock = (nodes: unknown[]): boolean =>
  nodes.some((node) => {
    if (!isRecord(node)) return false;
    const isBlock = node.type === 'block' || node.type === 'inlineBlock';
    if (isBlock && SUPPORTED_BLOCK_TYPES.includes(blockTypeOf(node.fields)) === false) return true;
    return containsUnsupportedBlock(childrenOf(node.children));
  });

// registry に対応済みの block は Markdown 往復できるので拒否しない。
// 未登録 block(将来追加される block 等)を含む本文だけ true。
export const hasUnsupportedBlocks = (body: Blog['body']): boolean => containsUnsupportedBlock(body.root.children);

// 登録済み全 block のフェンス形状を検証し、違反ごとの LLM 向け回復指示を連結して返す。
export const validateBlockFences = (markdown: string): string[] => blockSupports.flatMap((plugin) => plugin.validateFences(markdown));

// 登録済み全 block のフェンスが参照する media id を列挙(存在チェック用)。
export const extractBlockMediaIDs = (markdown: string): number[] => blockSupports.flatMap((plugin) => plugin.extractMediaIDs(markdown));

// 登録済み全 block の構文説明(LLM 向け)を連結。tool の bodyMarkdown 説明に載せる。
export const blockSyntaxHelp = (): string => blockSupports.map((plugin) => plugin.syntaxHelp).join('\n\n');
