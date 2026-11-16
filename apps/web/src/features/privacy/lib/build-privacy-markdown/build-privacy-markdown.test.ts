import { describe, expect, it } from 'vitest';

import { buildPrivacyMarkdown } from '.';
import { privacy } from '../../content';

import type { PrivacyContent } from '../../content';

const BASE = 'https://example.com';

const fixture: PrivacyContent = {
  title: 'privacy',
  kicker: '// kicker',
  lead: 'リード。',
  description: 'リード。',
  lastUpdatedLabel: 'last updated',
  lastUpdated: '2026-11-16',
  sections: [
    {
      no: '01',
      heading: 'collected',
      question: '// 何を受け取る？',
      blocks: [
        { kind: 'paragraph', text: '本文その1。' },
        { kind: 'list', items: ['お名前', 'メールアドレス'] },
      ],
    },
    {
      no: '02',
      heading: 'third parties',
      question: '// どこに送られる？',
      blocks: [
        {
          kind: 'table',
          caption: '次のサービスを使っています。',
          columns: { service: 'サービス', purpose: '何のため', data: '送られるもの' },
          rows: [{ service: 'A | B', purpose: '確かめる', data: '情報' }],
        },
      ],
    },
    {
      no: '03',
      heading: 'contact',
      question: '// 消してほしいときは？',
      blocks: [{ kind: 'mail', before: '消したいときは、', address: 'a@example.com', after: ' に連絡してください。' }],
    },
  ],
};

describe('buildPrivacyMarkdown', () => {
  it('renders frontmatter, the title, every section block, and the last updated line', () => {
    expect(buildPrivacyMarkdown(fixture, BASE)).toBe(
      [
        '---',
        'title: "privacy"',
        'url: "https://example.com/privacy"',
        'updated: "2026-11-16"',
        '---',
        '',
        '# privacy',
        '',
        '> リード。',
        '',
        '## collected',
        '',
        '// 何を受け取る？',
        '',
        '本文その1。',
        '',
        '- お名前',
        '- メールアドレス',
        '',
        '## third parties',
        '',
        '// どこに送られる？',
        '',
        '次のサービスを使っています。',
        '',
        '| サービス | 何のため | 送られるもの |',
        '| --- | --- | --- |',
        '| A \\| B | 確かめる | 情報 |',
        '',
        '## contact',
        '',
        '// 消してほしいときは？',
        '',
        '消したいときは、[a@example.com](mailto:a@example.com) に連絡してください。',
        '',
        'last updated: 2026-11-16',
        '',
      ].join('\n'),
    );
  });

  it('renders all five sections and the four services of the real content as a GFM table', () => {
    const markdown = buildPrivacyMarkdown(privacy, BASE);
    for (const heading of ['collected', 'purpose', 'third parties', 'cookies', 'contact']) {
      expect(markdown).toContain(`\n## ${heading}\n`);
    }
    expect(markdown).toContain('| サービス | 何のため | 送られるもの |');
    for (const service of ['Cloudflare Turnstile', 'Resend', 'Discord', 'Cloudflare Web Analytics']) {
      expect(markdown).toContain(`\n| ${service} | `);
    }
    expect(markdown).toContain('[contact@napochaan.com](mailto:contact@napochaan.com)');
    expect(markdown).toContain('url: "https://example.com/privacy"');
  });
});
