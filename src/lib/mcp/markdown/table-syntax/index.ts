import { splitCodeFences } from '../code-fences';

// vendor(EXPERIMENTAL_TableFeature)の import が扱えない table 構文を write 時に
// reject する(mcp-write-strict)。対象は table 行(| で開始・終了する行)のみ:
// - セル内 \| : import は naive な split('|') でエスケープ非対応 — 黙って列がズレる
// - 配置指定 divider(:--- / ---: / :---:): import は受理するが alignment を捨てる(lossy)
// - セル内 literal \n : import が space に潰す(markdown.integration.test.ts で pin 済みの lossy 挙動)
// コードフェンス内は例示テキストなので検証しない(code-fences と同じ扱い)。
const TABLE_ROW_PATTERN = /^\|.*\|\s*$/;
const DIVIDER_PATTERN = /^(\|\s*:?-+:?\s*)+\|\s*$/;

const validateTableRow = (line: string): string[] => [
  ...(line.includes('\\|') ? [`table のセル内に \\| は使えません(markdown 変換がセル区切りと区別できず表が壊れます)。| を含むセルが必要な表は admin から編集してください。該当行: ${line}`] : []),
  ...(DIVIDER_PATTERN.test(line) && line.includes(':')
    ? [`table の配置指定(:--- / ---: / :---:)は対応していません(保存時に失われます)。区切り行は | --- | の形で書いてください。配置指定が必要な表は admin から編集してください。該当行: ${line}`]
    : []),
  ...(line.includes('\\n') ? [`table のセル内改行(\\n)は保存時に失われます(space に潰れます)。セルは 1 行で書き、複数行のセルが必要な表は admin から編集してください。該当行: ${line}`] : []),
];

export const validateTableSyntax = (markdown: string): string[] =>
  splitCodeFences(markdown)
    .filter((segment) => segment.kind === 'text')
    .flatMap((segment) => segment.text.split('\n'))
    .filter((line) => TABLE_ROW_PATTERN.test(line))
    .flatMap(validateTableRow);

// bodyMarkdown の tool description に載せる table 構文説明(LLM 向け)。
export const tableSyntaxHelp =
  '表は GFM table で書ける(1 行目ヘッダー、2 行目に | --- | 区切り)。制約: セル内に | / \\| は使えない、配置指定(:--- 等)非対応、セル内改行(\\n)非対応 — 1 セル 1 行。これらが必要な表は admin で編集する。';
