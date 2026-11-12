import { CodeBlock } from '@payloadcms/richtext-lexical';

import { fenceForCode } from '../../utils/code-fence';

import type { Block, BlockJSX } from 'payload';

// language select のキーと表示ラベル。キーは frontend の Shiki highlighter
// (src/components/rich-text/converters/code/highlighter)が preload している
// 言語セットと 1:1 で揃えること — ここに無い言語はハイライトされず plain text に
// フォールバックする。MCP 側の言語キー検証(./mcp-support)もこの定義を参照する。
// 同期は code.test.ts が highlighter の PRELOADED_LANGUAGE_KEYS と突き合わせて保証。
export const CODE_LANGUAGES = {
  typescript: 'TypeScript',
  tsx: 'TSX',
  css: 'CSS',
  json: 'JSON',
  bash: 'Bash',
} satisfies Record<string, string>;

const stringOf = (fields: Record<string, unknown>, key: string): string => {
  const value = fields[key];

  return typeof value === 'string' ? value : '';
};

// 先頭・末尾の改行 1 つずつを剥がす(フェンス開始行直後 / 終了行直前の改行)。
const trimEdgeNewlines = (children: string): string => {
  const withoutLead = children.startsWith('\n') ? children.slice(1) : children;

  return withoutLead.endsWith('\n') ? withoutLead.slice(0, -1) : withoutLead;
};

// Payload premade の codeConverter を置き換える自前 converter。差分は 2 点:
// 1. export: コード内容が行頭 ``` を含む場合、CommonMark の規則どおり外側の
//    フェンスを 1 段長くする(premade は常に ``` 固定でフェンスが早期終了する)。
//    長いフェンスは import 側の正規表現機構では往復できないため、MCP の書き込みは
//    mcp-support の validateFences が 4 連以上のフェンスを明示的に拒否する。
// 2. import: premade は言語キー省略のフェンスで `'```' + undefined` の文字列比較
//    ミスにより single-line 判定が誤爆し、code が "undefined..." になるバグがある
//    (3.84.1 の converter.js で確認)。language を '' に正規化して比較する。
const codeFenceConverter: BlockJSX = {
  customEndRegex: { optional: true, regExp: /[ \t]*```$/ },
  customStartRegex: /^[ \t]*```(\w+)?/,
  doNotTrimChildren: true,
  export: ({ fields }) => {
    const code = stringOf(fields, 'code');
    const language = stringOf(fields, 'language');
    const fence = fenceForCode(code);

    return `${fence}${language}\n${code}\n${fence}`;
  },
  import: ({ children, closeMatch, openMatch }) => {
    const language = openMatch?.[1] ?? '';
    const code = trimEdgeNewlines(children);
    // premade 由来の single-line 形式(```const x = 1```)への互換: 開始行が
    // 「``` + 言語キーのみ」でないのに閉じまで単一行なら、言語キャプチャは
    // コードの先頭部分だったとみなして復元する。
    const isSingleLineAndComplete = closeMatch !== null && !code.includes('\n') && openMatch?.input?.trim() !== `\`\`\`${language}`;
    if (isSingleLineAndComplete) return { code: `${language}${code}`, language: '' };

    return { code, language };
  },
};

// Payload 純正の premade Code block(slug 'Code', fields: language + code)。
// admin UI(code エディタ + 言語 select)は premade のものをそのまま使い、
// markdown converter だけ上の自前実装に差し替える。converter の
// customStartRegex(```(\w+)?)は ```image-row の行頭にも部分一致するので、
// BlocksFeature への登録順は必ず ImageRow → Code にすること
// (src/lib/payload/editor-features 参照)。
export const Code: Block = CodeBlock({
  languages: CODE_LANGUAGES,
  defaultLanguage: 'typescript',
  fieldOverrides: {
    labels: { singular: 'コード', plural: 'コード' },
    jsx: codeFenceConverter,
  },
});
