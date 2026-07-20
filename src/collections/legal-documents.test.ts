import { describe, expect, it } from 'vitest';

import { LegalDocuments } from './legal-documents';

import type { Access } from 'payload';

// access.read は Payload から (args) で呼ばれる。ここでは user の有無だけが効くので
// 最小の args を組んで結果の形を検証する。
const callRead = (user: unknown): unknown => {
  const read = LegalDocuments.access?.read as Access;
  return read({ req: { user } } as unknown as Parameters<Access>[0]);
};

describe('LegalDocuments', () => {
  it('公開側(未ログイン)には published のみを見せる', () => {
    expect(callRead(null)).toEqual({ _status: { equals: 'published' } });
  });

  it('ログイン中は全件見せる', () => {
    expect(callRead({ id: 1 })).toBe(true);
  });

  it('draft + autosave を有効にしている(Live Preview リアルタイム反映用)', () => {
    expect(LegalDocuments.versions).toEqual({ drafts: { autosave: { interval: 375 } } });
  });

  it('slug / title / effectiveAt / body + 公開 URL の ui フィールドを持つ', () => {
    const names = LegalDocuments.fields.map((field) => ('name' in field ? field.name : undefined));
    expect(names).toEqual(['slug', 'title', 'effectiveAt', 'body', 'publicURL']);
  });
});
