import { describe, expect, it } from 'vitest';

import { applyLinkNewTabPolicy, resolveNewTab } from '.';

import type { Blog } from '@payload-types';

const SITE = 'https://napochaan.com';

describe('resolveNewTab', () => {
  it.each([
    ['https://booth.pm/ja/items/1', true],
    ['http://example.com/page', true],
    ['https://napochaan.com/blog/v3', false],
    ['https://NAPOCHAAN.COM/blog/v3', false], // URL が hostname を小文字正規化するので自ホスト
    ['https://stg.napochaan.com/blog/v3', true], // サブドメインは別ホスト扱い（spec 承認済み）
    ['/blog/v3', false],
    ['#section', false],
    ['mailto:hi@napochaan.com', false],
    ['tel:+81-90-0000-0000', false],
    ['not a url', false],
    ['', false],
  ])('resolveNewTab(%j) === %j', (url, expected) => {
    expect(resolveNewTab(url, SITE)).toBe(expected);
  });

  it('siteBaseUrl がパース不能でも throw せず false に落ちる', () => {
    expect(resolveNewTab('https://example.com', 'not a url')).toBe(false);
  });
});

type NodeRecord = Record<string, unknown>;

const linkNode = (fields: NodeRecord): NodeRecord => ({
  type: 'link',
  version: 3,
  fields,
  children: [{ type: 'text', text: 'x', version: 1 }],
});

// 段落 1 つに inline ノード群を入れた最小 body。tools.test.ts の paragraphBody と
// 同じ「テストでは as で lexical 形を作る」流儀。
const bodyWith = (...nodes: NodeRecord[]): Blog['body'] =>
  ({
    root: { type: 'root', children: [{ type: 'paragraph', version: 1, children: nodes }], direction: null, format: '', indent: 0, version: 1 },
  }) as unknown as Blog['body'];

const inlineNodesOf = (body: Blog['body']): NodeRecord[] => {
  const [paragraph] = body.root.children;
  return (paragraph as unknown as { children: NodeRecord[] }).children;
};

describe('applyLinkNewTabPolicy', () => {
  it('外部ホストの custom link は newTab: true になる', () => {
    const body = bodyWith(linkNode({ linkType: 'custom', newTab: false, url: 'https://booth.pm/x' }));
    const [link] = inlineNodesOf(applyLinkNewTabPolicy(body, SITE));
    expect((link?.fields as NodeRecord).newTab).toBe(true);
  });

  it('自ホスト絶対 URL と相対 URL は newTab: false のまま', () => {
    const body = bodyWith(linkNode({ linkType: 'custom', newTab: true, url: 'https://napochaan.com/blog/v3' }), linkNode({ linkType: 'custom', newTab: true, url: '/blog/v3' }));
    const nodes = inlineNodesOf(applyLinkNewTabPolicy(body, SITE));
    expect(nodes.map((node) => (node.fields as NodeRecord).newTab)).toEqual([false, false]);
  });

  it('autolink ノードにも適用される', () => {
    const body = bodyWith({ ...linkNode({ linkType: 'custom', newTab: false, url: 'https://example.com' }), type: 'autolink' });
    const [link] = inlineNodesOf(applyLinkNewTabPolicy(body, SITE));
    expect((link?.fields as NodeRecord).newTab).toBe(true);
  });

  it('linkType: internal の doc リンクは fields を触らない', () => {
    const fields = { linkType: 'internal', newTab: false, doc: { relationTo: 'blog', value: 1 } };
    const body = bodyWith(linkNode(fields));
    const [link] = inlineNodesOf(applyLinkNewTabPolicy(body, SITE));
    expect(link?.fields).toEqual(fields);
  });

  it('ネストした構造（list > listitem > link）でも適用される', () => {
    const nested = {
      root: {
        type: 'root',
        direction: null,
        format: '',
        indent: 0,
        version: 1,
        children: [
          {
            type: 'list',
            version: 1,
            children: [{ type: 'listitem', version: 1, children: [linkNode({ linkType: 'custom', newTab: false, url: 'https://booth.pm/x' })] }],
          },
        ],
      },
    } as unknown as Blog['body'];
    const result = applyLinkNewTabPolicy(nested, SITE);
    const [list] = result.root.children;
    const [item] = (list as unknown as { children: NodeRecord[] }).children;
    const [link] = (item?.children as NodeRecord[] | undefined) ?? [];
    expect((link?.fields as NodeRecord).newTab).toBe(true);
  });

  it('link 以外のノードと無関係な fields は保存される', () => {
    const text = { type: 'text', text: 'plain', version: 1, format: 1 };
    const body = bodyWith(text, linkNode({ linkType: 'custom', newTab: false, url: 'https://booth.pm/x', id: 'abc' }));
    const [kept, link] = inlineNodesOf(applyLinkNewTabPolicy(body, SITE));
    expect(kept).toEqual(text);
    expect((link?.fields as NodeRecord).id).toBe('abc');
  });

  it('入力 body を mutate しない', () => {
    const body = bodyWith(linkNode({ linkType: 'custom', newTab: false, url: 'https://booth.pm/x' }));
    const snapshot = structuredClone(body);
    applyLinkNewTabPolicy(body, SITE);
    expect(body).toEqual(snapshot);
  });
});
