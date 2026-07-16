import { convertLexicalToMarkdown, convertMarkdownToLexical } from '@payloadcms/richtext-lexical';

import type { SanitizedServerEditorConfig } from '@payloadcms/richtext-lexical';
import type { Blog } from '@payload-types';

export type MarkdownCodec = {
  toLexical: (markdown: string) => Blog['body'];
  toMarkdown: (data: Blog['body']) => string;
};

// editorConfig はプロジェクトの root lexical editor 設定(BlocksFeature([ImageRow]) 込み)を
// 渡すこと(呼び出し側の責務。route.ts で `payload.config.editor.editorConfig` から解決する)。
// `editorConfigFactory.default` は Payload のグローバルキャッシュされた汎用 default editor を
// 返すだけで payload.config.editor から導出されないため、プロジェクトの block 登録
// (BlocksFeature([ImageRow]) 等)を含まない。ここでは絶対に使わないこと。
export const createMarkdownCodec = (editorConfig: SanitizedServerEditorConfig): MarkdownCodec => ({
  toLexical: (markdown) => convertMarkdownToLexical({ editorConfig, markdown }),
  toMarkdown: (data) => convertLexicalToMarkdown({ editorConfig, data }),
});

// 画像参照。alt が media:<数字> のもの(単一 media プレースホルダ / image-row セル)は
// 生 URL ではないので除外する。それ以外の ![alt](非空) を生 URL として返す。
const IMAGE_REF = /!\[([^\]]*)\]\(([^)]+)\)/g;
const MEDIA_ALT = /^media:\d+$/;

export const findRawImageRefs = (markdown: string): string[] => [...markdown.matchAll(IMAGE_REF)].filter((match) => MEDIA_ALT.test(match[1] ?? '') === false).map((match) => match[0]);

// MCP が Markdown 往復できる block。増えたらここに足す。
const SUPPORTED_BLOCK_TYPES = ['image-row'];

type LexicalNode = { type?: string; fields?: { blockType?: string }; children?: LexicalNode[] };

const containsUnsupportedBlock = (nodes: LexicalNode[]): boolean =>
  nodes.some((node) => {
    const isBlock = node.type === 'block' || node.type === 'inlineBlock';
    if (isBlock && SUPPORTED_BLOCK_TYPES.includes(node.fields?.blockType ?? '') === false) return true;
    return containsUnsupportedBlock(node.children ?? []);
  });

// 対応済み block(image-row)は Markdown 往復できるので拒否しない。
// 未対応 block(将来の block 等)を含む本文だけ true。
export const hasUnsupportedBlocks = (body: Blog['body']): boolean => containsUnsupportedBlock(body.root.children as LexicalNode[]);

// ```image-row フェンスとセル行。
const IMAGE_ROW_FENCE = /^```image-row\s*\n([\s\S]*?)^```\s*$/gm;
const CELL_LINE = /^\s*!\[media:(\d+)\]\((.*)\)\s*$/;

const fenceCellLines = (inner: string): string[] =>
  inner
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

// 各 image-row フェンスが「ちょうど2行の ![media:<id>](...)」であることを検証。
// 違反ごとに LLM 向け回復指示を返す。
export const validateImageRowFences = (markdown: string): string[] =>
  [...markdown.matchAll(IMAGE_ROW_FENCE)]
    .filter((match) => {
      const lines = fenceCellLines(match[1] ?? '');
      const cells = lines.filter((line) => CELL_LINE.test(line));
      return lines.length !== 2 || cells.length !== 2;
    })
    .map((match) => `image-row フェンスは ![media:<id>](caption) をちょうど2行含む必要があります(画像2枚固定)。caption は省略可(![media:<id>]())。該当:\n${match[0]}`);

// 全 image-row フェンスの cell media id を列挙(存在チェック用)。
export const extractImageRowMediaIDs = (markdown: string): number[] =>
  [...markdown.matchAll(IMAGE_ROW_FENCE)].flatMap((match) =>
    fenceCellLines(match[1] ?? '')
      .map((line) => line.match(CELL_LINE))
      .filter((cell): cell is RegExpMatchArray => cell !== null)
      .map((cell) => parseInt(cell[1] ?? '', 10)),
  );
