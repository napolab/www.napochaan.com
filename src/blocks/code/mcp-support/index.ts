import { splitCodeFences } from '@lib/mcp/markdown/code-fences';

import { CODE_LANGUAGES } from '../index';

import type { McpBlockSupport } from '@lib/mcp/markdown/block-support';

const LANGUAGE_KEYS = Object.keys(CODE_LANGUAGES);

// 開始行が「``` + 言語キー(\w のみ)」または素の「```」であるフェンスだけがこの
// block の担当。\w はハイフンを含まないため、```image-row 等の他 block のフェンス
// 開始行には決してマッチしない(plugin が他 block の構文を知らずに済む境界線)。
const CODE_FENCE_OPEN = /^```(\w*)[ \t]*$/;

// 4 連以上のバッククォートフェンス。get_post(export)はコード内容が ``` 行を含む
// block をこの形で出力するが、lexical の import 機構(customStartRegex/EndRegex)は
// フェンス長を突き合わせられず内側の ``` で早期終了して内容を壊す。silent 破壊を
// 防ぐため書き込み側では明示的に拒否する。
const LONG_FENCE_OPEN = /^````/;

// splitCodeFences の fence セグメントは「開始行〜終了行」の連なりだが、隣接する
// フェンス同士は 1 セグメントに融合する。行を歩いてトグルを復元し、各フェンスの
// 開始行だけを列挙する(終了行 ``` を次のフェンスの開始と取り違えないため)。
const openingLines = (segment: string): string[] =>
  segment.split('\n').reduce<{ inFence: boolean; opens: string[] }>(
    (state, line) => {
      if (!line.startsWith('```')) return state;
      if (state.inFence) return { inFence: false, opens: state.opens };

      return { inFence: true, opens: [...state.opens, line] };
    },
    { inFence: false, opens: [] },
  ).opens;

const fenceSegments = (markdown: string): string[] =>
  splitCodeFences(markdown)
    .filter((segment) => segment.kind === 'fence')
    .map((segment) => segment.text);

// フェンス開始行 1 行を検証し、違反なら LLM 向け回復指示を返す。
// 通常の(バランスした)フェンスは構造としては常に妥当 — 検証するのは開始行のみ。
// language は Payload 側で select field として保存されるため、未対応キーはそのまま
// 通すと create/update 時に select の options 検証で不親切な ValidationError になる。
// ここで対応キー一覧つきの回復指示に変換して先に返す(read 正規化・write 厳格の方針:
// silent なキー変換はしない)。キー省略(素の ```)は妥当。
const validateOpeningLine = (line: string): string[] => {
  if (LONG_FENCE_OPEN.test(line)) {
    return [
      `4連以上のバッククォートによるコードフェンスは書き込みに使えません(コード内容自体に \`\`\` 行を含むコードブロックは MCP からは作成・更新できず、admin から編集してください)。該当行: ${line}`,
    ];
  }

  const match = line.match(CODE_FENCE_OPEN);
  const lang = match?.[1];
  if (lang === undefined || lang === '' || LANGUAGE_KEYS.includes(lang)) return [];

  return [`コードフェンスの言語キー "${lang}" は未対応です。対応キー: ${LANGUAGE_KEYS.join(' / ')}(キー省略も可)。該当行: ${line}`];
};

const validateFences = (markdown: string): string[] =>
  fenceSegments(markdown)
    .flatMap((segment) => openingLines(segment))
    .flatMap((line) => validateOpeningLine(line));

// LLM 向けの構文説明。tool の bodyMarkdown 説明に集約される。
const syntaxHelp = [
  'コードブロック(標準 Markdown のフェンス構文がそのまま使える):',
  `\`\`\`<lang> の行で開始し \`\`\` の行で閉じる。<lang> は ${LANGUAGE_KEYS.join(' / ')} のいずれか(省略可・省略時はハイライトなし)。`,
  'フェンス内は例示テキストとして扱われ、画像参照の検証・書き換えの対象にならない。',
  'コード内容自体に ``` の行を含めることはできない(4連バッククォートのフェンスは未対応)。例:',
  '```typescript',
  'const x = 1;',
  '```',
].join('\n');

// MCP の markdown registry(src/lib/mcp/markdown)に登録する Code block の plugin。
// フェンス構文は標準 Markdown そのもので、Lexical との往復は src/blocks/code の
// 自前 jsx converter が担う — ここは validate だけを持つ。
export const codeMcpSupport: McpBlockSupport = {
  blockType: 'Code',
  syntaxHelp,
  validateFences,
  // コードフェンスは media を参照しない。
  extractMediaIDs: () => [],
};
