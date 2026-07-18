import type { Blog } from '@payload-types';

// MCP write path のリンク newTab 導出。サイト方針「内部リンク=同タブ・外部リンク=別タブ」を
// URL から決定的に導出する（Markdown には newTab を表現する構文がなく、Payload の
// markdown→lexical 変換は newTab: false 固定のため）。設計は
// docs/superpowers/specs/2026-07-19-mcp-link-newtab-design.md を参照。
const HTTP_ABSOLUTE = /^https?:\/\//i;

export const resolveNewTab = (url: string, siteBaseUrl: string): boolean => {
  if (!HTTP_ABSOLUTE.test(url)) return false;
  try {
    return new URL(url).hostname !== new URL(siteBaseUrl).hostname;
  } catch {
    return false;
  }
};

type BodyNode = Blog['body']['root']['children'][number];

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

// lexical の子ノードは payload-types では index signature 越しの unknown。
// type を持つレコードだけを変換対象にする（他は素通し — 落とさない）。
const isBodyNode = (value: unknown): value is BodyNode => isRecord(value) && typeof value.type === 'string';

const transformNode = (node: BodyNode, siteBaseUrl: string): BodyNode => {
  const withChildren = 'children' in node ? { ...node, children: transformChildren(node.children, siteBaseUrl) } : node;
  if (node.type !== 'link' && node.type !== 'autolink') return withChildren;
  const fields = isRecord(node.fields) ? node.fields : {};
  // internal doc リンクは admin 専用の形（URL を持たない）— ポリシー対象外。
  if (fields.linkType === 'internal') return withChildren;
  const url = typeof fields.url === 'string' ? fields.url : '';
  return { ...withChildren, fields: { ...fields, newTab: resolveNewTab(url, siteBaseUrl) } };
};

const transformChildren = (children: unknown, siteBaseUrl: string): unknown => {
  if (!Array.isArray(children)) return children;
  return children.map((child) => (isBodyNode(child) ? transformNode(child, siteBaseUrl) : child));
};

// Lexical tree を再帰的に歩き、link/autolink ノードの newTab を URL から常に再導出する。
// update_post の round-trip でも毎回適用される（「常に再導出」 — spec の承認済み決定）。
export const applyLinkNewTabPolicy = (body: Blog['body'], siteBaseUrl: string): Blog['body'] => ({
  ...body,
  root: { ...body.root, children: body.root.children.map((node) => transformNode(node, siteBaseUrl)) },
});
