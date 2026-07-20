import { convertLexicalToMarkdown, convertMarkdownToLexical } from '@payloadcms/richtext-lexical';

import { createLinkEmbedTransform } from '@utils/lexical/link-embed';

import { codeMcpSupport } from '../../../blocks/code/mcp-support';
import { imageRowMcpSupport } from '../../../blocks/image-row/mcp-support';
import { youtubeEmbedMcpSupport } from '../../../blocks/youtube-embed/mcp-support';

import type { McpBlockSupport } from './block-support';
import type { SanitizedServerEditorConfig } from '@payloadcms/richtext-lexical';
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';
import type { Blog } from '@payload-types';

export type MarkdownCodec<TBody extends SerializedEditorState> = {
  toLexical: (markdown: string) => TBody;
  toMarkdown: (data: TBody) => string;
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
export const createMarkdownCodec = <TBody extends SerializedEditorState>(editorConfig: SanitizedServerEditorConfig): MarkdownCodec<TBody> => ({
  toLexical: (markdown) => transformBlockLinkEmbeds(convertMarkdownToLexical({ editorConfig, markdown })) as unknown as TBody,
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

// ---- table round-trip guard --------------------------------------------------
// EXPERIMENTAL_TableFeature の markdown transformer は結合セル(colSpan/rowSpan)を
// export で捨て、セル内の | をエスケープしない。また | で開始・終了する段落テキストは
// export した markdown が table 行として re-import される(linebreak で複数行に
// 分かれる段落は、その行単位で判定する必要がある)。加えて table セルの子ブロックが
// paragraph 以外(heading 等)だと export で `| ## x |` のような行に潰れ、re-import では
// 通常の段落にダウングレードされる。これらを含む本文は get_post → update_post の
// 往復で黙って壊れるため、hasUnsupportedBlocks と同じ bodyEditable=false 扱いにする
// (判定はここ、tool 側の分岐は src/lib/mcp/tools)。

const TABLE_LIKE_LINE = /^\|.*\|\s*$/;

const cellHasMergedSpan = (cell: Record<string, unknown>): boolean => {
  const colSpan = typeof cell.colSpan === 'number' ? cell.colSpan : 1;
  const rowSpan = typeof cell.rowSpan === 'number' ? cell.rowSpan : 1;

  return colSpan > 1 || rowSpan > 1;
};

// linebreak node は '\n' として出す。export が実際に改行するため、
// TABLE_LIKE_LINE の判定は行単位で行う必要がある(paragraphLinesOf 参照)。
const textOf = (nodes: unknown[]): string =>
  nodes
    .map((node) => {
      if (!isRecord(node)) return '';
      if (node.type === 'linebreak') return '\n';
      if (typeof node.text === 'string') return node.text;

      return textOf(childrenOf(node.children));
    })
    .join('');

// 段落の inline children を linebreak で分割した各行のテキストを返す。
const paragraphLinesOf = (nodes: unknown[]): string[] => textOf(nodes).split('\n');

const containsPipeText = (nodes: unknown[]): boolean =>
  nodes.some((node) => {
    if (!isRecord(node)) return false;
    if (typeof node.text === 'string' && node.text.includes('|')) return true;

    return containsPipeText(childrenOf(node.children));
  });

const containsLineBreak = (nodes: unknown[]): boolean =>
  nodes.some((node) => {
    if (!isRecord(node)) return false;
    if (node.type === 'linebreak') return true;

    return containsLineBreak(childrenOf(node.children));
  });

// セル内改行(linebreak node / 複数ブロック)は export が literal \n にするが、
// re-import で space に潰れる(markdown.integration.test.ts で pin 済みの lossy 挙動)。
const cellHasLineBreaks = (cell: Record<string, unknown>): boolean => childrenOf(cell.children).length > 1 || containsLineBreak(childrenOf(cell.children));

// セルの直下ブロックが paragraph 以外(heading 等)だと export で `| ## x |` のような
// 1行に潰れ、re-import では通常の(パディングされた)段落にダウングレードされる。
const cellHasNonParagraphChild = (cell: Record<string, unknown>): boolean => childrenOf(cell.children).some((child) => isRecord(child) && child.type !== 'paragraph');

const isNonRoundTrippableCell = (cell: Record<string, unknown>): boolean =>
  cellHasMergedSpan(cell) || containsPipeText(childrenOf(cell.children)) || cellHasLineBreaks(cell) || cellHasNonParagraphChild(cell);

// 段落は linebreak で複数行に export される。そのうち1行でも table 行の形をしていれば、
// re-import 時にその行だけ table 行として取り込まれてしまう。
const paragraphHasTableLikeLine = (node: Record<string, unknown>): boolean => paragraphLinesOf(childrenOf(node.children)).some((line) => TABLE_LIKE_LINE.test(line.trim()));

const containsNonRoundTrippableTable = (nodes: unknown[]): boolean =>
  nodes.some((node) => {
    if (!isRecord(node)) return false;
    if (node.type === 'tablecell' && isNonRoundTrippableCell(node)) return true;
    if (node.type === 'paragraph' && paragraphHasTableLikeLine(node)) return true;

    return containsNonRoundTrippableTable(childrenOf(node.children));
  });

// markdown 往復で情報が失われる・構造が壊れる table(または table に化ける段落)を含むか。
export const hasNonRoundTrippableTables = (body: Blog['body']): boolean => containsNonRoundTrippableTable(body.root.children);

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
