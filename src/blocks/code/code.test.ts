import { describe, expect, it } from 'vitest';

import { CODE_LANGUAGES, Code } from '.';

// select field の options は { label, value } 配列。value だけを取り出す。
const languageOptionValues = (): string[] => {
  const language = Code.fields.find((field) => 'name' in field && field.name === 'language');
  if (language === undefined || language.type !== 'select') throw new Error('language select field not found');

  return language.options.map((option) => (typeof option === 'string' ? option : option.value));
};

describe('Code block definition', () => {
  it('uses the premade slug "Code"', () => {
    expect(Code.slug).toBe('Code');
  });

  it('offers exactly the Shiki-preloaded language keys', () => {
    // frontend highlighter(converters/code/highlighter)の preload セットと同期
    expect(languageOptionValues()).toEqual(Object.keys(CODE_LANGUAGES));
    expect(Object.keys(CODE_LANGUAGES)).toEqual(['typescript', 'tsx', 'css', 'json', 'bash']);
  });

  it('defaults the language to typescript', () => {
    const language = Code.fields.find((field) => 'name' in field && field.name === 'language');
    if (language === undefined || language.type !== 'select') throw new Error('language select field not found');
    expect(language.defaultValue).toBe('typescript');
  });

  it('has a code field for the raw source', () => {
    const code = Code.fields.find((field) => 'name' in field && field.name === 'code');
    expect(code?.type).toBe('code');
  });
});

describe('Code block markdown round-trip (premade jsx converter)', () => {
  // 実際の変換ではネスト変換用に本物の関数が渡るが、Code の converter は
  // どちらも使わないためスタブで十分。
  const lexicalToMarkdown = () => '';
  const markdownToLexical = () => ({});

  it('exports fields as a standard ```lang fence', () => {
    const markdown = Code.jsx?.export({ fields: { code: 'const x = 1;\nconst y = 2;', language: 'typescript' }, lexicalToMarkdown });
    expect(markdown).toBe(['```typescript', 'const x = 1;', 'const y = 2;', '```'].join('\n'));
  });

  it('imports fence children back into code + language fields', () => {
    const openMatch = '```typescript\n'.match(/^[ \t]*```(\w+)?/);
    if (openMatch === null) throw new Error('open match failed');
    const result = Code.jsx?.import({ children: 'const x = 1;', closeMatch: null, openMatch, markdownToLexical, props: {} });
    expect(result).toEqual({ code: 'const x = 1;', language: 'typescript' });
  });
});
