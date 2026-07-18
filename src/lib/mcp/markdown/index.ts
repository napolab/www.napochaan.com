import { convertLexicalToMarkdown, convertMarkdownToLexical } from '@payloadcms/richtext-lexical';

import { createLinkEmbedTransform } from '@utils/lexical/link-embed';

import { codeMcpSupport } from '../../../blocks/code/mcp-support';
import { imageRowMcpSupport } from '../../../blocks/image-row/mcp-support';
import { youtubeEmbedMcpSupport } from '../../../blocks/youtube-embed/mcp-support';

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
// write 側の順序は「呼び出し元(src/lib/mcp/tools の validateBodyMarkdown)が raw 入力を
// validateBlockFences で検証 → toLexical が convertMarkdownToLexical → transformBlockLinkEmbeds」。
// Markdown は前処理なしでそのまま変換に渡り(内部フェンス等の中間表現は存在しない)、
// 公開構文 → block node の置き換えは変換後の lexical tree に対して行う
// (markdown.test.ts が順序を固定している)。
export const createMarkdownCodec = (editorConfig: SanitizedServerEditorConfig): MarkdownCodec => ({
  toLexical: (markdown) => transformBlockLinkEmbeds(convertMarkdownToLexical({ editorConfig, markdown })),
  toMarkdown: (data) => convertLexicalToMarkdown({ editorConfig, data }),
});

// MCP が Markdown ⇔ Lexical を往復できる block の registry。増えたら block 側に
// plugin(McpBlockSupport)を書いてここに登録する。block 追加時にこのファイルに
// 増えるのは import 1 行と blockSupports への登録 1 行だけで、分岐やロジックは
// 増えない。validate / extract / syntaxHelp は fan-out 集約 — 全 plugin を毎回実行し
// 結果を連結する(Payload 自身の markdown transformer は jsx.customStartRegex で
// first-match dispatch 済みなので、この層で二重にやる必要はない)。linkEmbedProvider
// だけは first-match 合成(下の transformBlockLinkEmbeds)で、優先順 = この登録順。
const blockSupports: readonly McpBlockSupport[] = [imageRowMcpSupport, youtubeEmbedMcpSupport, codeMcpSupport];

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
// validateFences を持たない plugin(フェンス構文を公開していない block)は素通し。
export const validateBlockFences = (markdown: string): string[] => blockSupports.flatMap((plugin) => plugin.validateFences?.(markdown) ?? []);

// linkEmbedProvider を公開する plugin の provider を集め、汎用 link-embed transform
// 1 本に合成する(provider 無しの plugin は素通し)。段落ごとの first-match の優先順は
// blockSupports の登録順 — より具体的な URL を受ける provider が将来必要になったら
// その plugin を先に登録すること(prefix-match-processor: broad が先だと specific を隠す)。
// codec.toLexical の内側でのみ使うこと — 検証(validateBlockFences)は raw Markdown
// 入力に対して先に済んでいる前提。
const linkEmbedProviders = blockSupports.flatMap((plugin) => plugin.linkEmbedProvider ?? []);
export const transformBlockLinkEmbeds = createLinkEmbedTransform(linkEmbedProviders);

// 登録済み全 block のフェンスが参照する media id を列挙(存在チェック用)。
export const extractBlockMediaIDs = (markdown: string): number[] => blockSupports.flatMap((plugin) => plugin.extractMediaIDs(markdown));

// 登録済み全 block の構文説明(LLM 向け)を連結。tool の bodyMarkdown 説明に載せる。
export const blockSyntaxHelp = (): string => blockSupports.map((plugin) => plugin.syntaxHelp).join('\n\n');
