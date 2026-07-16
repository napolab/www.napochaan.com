import { convertLexicalToMarkdown, convertMarkdownToLexical } from '@payloadcms/richtext-lexical';

import type { SanitizedServerEditorConfig } from '@payloadcms/richtext-lexical';
import type { Blog } from '@payload-types';

export type MarkdownCodec = {
  toLexical: (markdown: string) => Blog['body'];
  toMarkdown: (data: Blog['body']) => string;
};

// editorConfig はグローバル editor 設定(BlocksFeature 込み)から
// `await editorConfigFactory.default({ config: payload.config })` で作る(呼び出し側の責務)。
export const createMarkdownCodec = (editorConfig: SanitizedServerEditorConfig): MarkdownCodec => ({
  toLexical: (markdown) => convertMarkdownToLexical({ editorConfig, markdown }),
  toMarkdown: (data) => convertLexicalToMarkdown({ editorConfig, data }),
});

// UploadFeature のプレースホルダ `![media:<id>]()` は括弧が空。
// 括弧に中身がある画像参照 = サイト外 URL の直貼りなので入稿を弾く。
const RAW_IMAGE_REF = /!\[[^\]]*\]\([^)]+\)/g;

export const findRawImageRefs = (markdown: string): string[] => [...markdown.matchAll(RAW_IMAGE_REF)].map((match) => match[0]);

type LexicalNode = { type?: string; children?: LexicalNode[] };

const containsBlockNode = (nodes: LexicalNode[]): boolean => nodes.some((node) => node.type === 'block' || node.type === 'inlineBlock' || containsBlockNode(node.children ?? []));

// image-row 等の独自 block は Markdown で表現できず、toMarkdown → toLexical の
// round-trip で消滅する。含まれる記事の本文上書きを拒否するための検出器。
export const hasUnsupportedBlocks = (body: Blog['body']): boolean => containsBlockNode(body.root.children as LexicalNode[]);
