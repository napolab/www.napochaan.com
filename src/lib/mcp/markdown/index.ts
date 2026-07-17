import { convertLexicalToMarkdown, convertMarkdownToLexical } from '@payloadcms/richtext-lexical';

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

// ```image-row フェンスとセル行。
const IMAGE_ROW_FENCE = /^```image-row\s*\n([\s\S]*?)^```\s*$/gm;
const CELL_LINE = /^\s*!\[media:(\d+)\]\((.*)\)\s*$/;

const fenceCellLines = (inner: string): string[] =>
  inner
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

// image-row フェンスを丸ごと除去した Markdown を返す。caption 付き media 参照
// (![media:<id>](caption))は image-row フェンス内でのみ有効な構文なので、
// フェンスを除去した残りを生URL画像参照スキャンにかければフェンス外の誤用
// (caption 付き media 参照 / 本物の生 URL)だけが対象になる。
const stripImageRowFences = (markdown: string): string => markdown.replace(IMAGE_ROW_FENCE, '');

// 画像参照。フェンス除去後に ![alt](非空) が残っていたら、生 URL 画像か
// image-row 専用構文(caption 付き media 参照)のフェンス外での誤用。
// 単一 media プレースホルダ ![media:<id>]() は空 parens のためマッチしない。
const RAW_IMAGE_REF = /!\[[^\]]*\]\([^)]+\)/g;

export const findRawImageRefs = (markdown: string): string[] => [...stripImageRowFences(markdown).matchAll(RAW_IMAGE_REF)].map((match) => match[0]);

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
