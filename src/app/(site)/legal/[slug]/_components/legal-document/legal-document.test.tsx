import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { LegalDocumentView } from './index';

import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';

const body = {
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: [
      {
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        children: [{ type: 'text', format: 0, style: '', mode: 'normal', detail: 0, text: '第1条 適用範囲', version: 1 }],
      },
    ],
  },
} as unknown as SerializedEditorState;

describe('LegalDocumentView', () => {
  it('タイトルを h1 として描画する', async () => {
    await render(<LegalDocumentView title="ソフトウェア利用規約" effectiveAt="2026-08-01" body={body} />);
    await expect.element(page.getByRole('heading', { level: 1, name: 'ソフトウェア利用規約' })).toBeInTheDocument();
  });

  it('本文を描画する', async () => {
    await render(<LegalDocumentView title="ソフトウェア利用規約" effectiveAt="2026-08-01" body={body} />);
    await expect.element(page.getByText('第1条 適用範囲')).toBeInTheDocument();
  });

  it('施行日を time 要素として描画する', async () => {
    await render(<LegalDocumentView title="ソフトウェア利用規約" effectiveAt="2026-08-01" body={body} />);
    await expect.element(page.getByText('2026年8月1日 施行')).toHaveAttribute('datetime', '2026-08-01');
  });

  it('パンくずを 2 階層で描画する(中間の legal クラムを置かない)', async () => {
    await render(<LegalDocumentView title="ソフトウェア利用規約" effectiveAt="2026-08-01" body={body} />);
    await expect.element(page.getByRole('navigation', { name: 'パンくず' })).toBeInTheDocument();
    // ScrambleText が同じラベルを 2 度描画する(幅確保のゴースト + オーバーレイ)ため first() で絞る。
    await expect.element(page.getByText('home').first()).toBeInTheDocument();
    await expect.element(page.getByText('legal')).not.toBeInTheDocument();
  });
});
