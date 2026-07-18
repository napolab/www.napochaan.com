import { describe, expect, it } from 'vitest';

import { PRELOADED_LANGUAGE_KEYS } from '../../components/rich-text/converters/code/highlighter';

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
    // frontend highlighter(converters/code/highlighter)の preload セットと 1:1
    expect(languageOptionValues()).toEqual(Object.keys(CODE_LANGUAGES));
    expect(Object.keys(CODE_LANGUAGES)).toEqual([...PRELOADED_LANGUAGE_KEYS]);
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

describe('Code block markdown round-trip (custom jsx converter)', () => {
  // 実際の変換ではネスト変換用に本物の関数が渡るが、Code の converter は
  // どちらも使わないためスタブで十分。
  const lexicalToMarkdown = () => '';
  const markdownToLexical = () => ({});

  const openMatchOf = (line: string): RegExpMatchArray => {
    const match = line.match(/^[ \t]*```(\w+)?/);
    if (match === null) throw new Error('open match failed');

    return match;
  };

  // markdownTransformer は行フェンスでは非 null の closeMatch を渡す。
  const closeMatchOf = (): RegExpMatchArray => {
    const match = '```'.match(/[ \t]*```$/);
    if (match === null) throw new Error('close match failed');

    return match;
  };

  it('exports fields as a standard ```lang fence', () => {
    const markdown = Code.jsx?.export({ fields: { code: 'const x = 1;\nconst y = 2;', language: 'typescript' }, lexicalToMarkdown });
    expect(markdown).toBe(['```typescript', 'const x = 1;', 'const y = 2;', '```'].join('\n'));
  });

  it('widens the fence when the code itself contains a ``` line', () => {
    const code = '例:\n```bash\nnpm run build\n```';
    const markdown = Code.jsx?.export({ fields: { code, language: 'typescript' }, lexicalToMarkdown });
    expect(markdown).toBe(['````typescript', '例:', '```bash', 'npm run build', '```', '````'].join('\n'));
  });

  it('imports fence children back into code + language fields', () => {
    const result = Code.jsx?.import({ children: '\nconst x = 1;\n', closeMatch: closeMatchOf(), openMatch: openMatchOf('```typescript'), markdownToLexical, props: {} });
    expect(result).toEqual({ code: 'const x = 1;', language: 'typescript' });
  });

  // premade converter は language 未捕捉時に '```' + undefined の比較ミスで
  // single-line 判定が誤爆し code が "undefined..." になる — 自前 converter の回帰ピン。
  it('imports a bare ``` fence with single-line content without corrupting it', () => {
    const result = Code.jsx?.import({ children: '\nnpm run build\n', closeMatch: closeMatchOf(), openMatch: openMatchOf('```'), markdownToLexical, props: {} });
    expect(result).toEqual({ code: 'npm run build', language: '' });
  });

  it('imports a bare ``` fence with multi-line content as plain code', () => {
    const result = Code.jsx?.import({ children: '\nline1\nline2\n', closeMatch: closeMatchOf(), openMatch: openMatchOf('```'), markdownToLexical, props: {} });
    expect(result).toEqual({ code: 'line1\nline2', language: '' });
  });

  // premade 由来の single-line 形式 ```const x = 1``` — 言語キャプチャがコードの
  // 先頭単語を食っているケースの復元互換。
  it('restores the single-line ```code``` form', () => {
    const openMatch = openMatchOf('```const x = 1```');
    const result = Code.jsx?.import({ children: ' x = 1', closeMatch: closeMatchOf(), openMatch, markdownToLexical, props: {} });
    expect(result).toEqual({ code: 'const x = 1', language: '' });
  });
});
