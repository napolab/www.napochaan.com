import { createMediaFilePlugin, DEFAULT_MEDIA_FILE_PATH_PREFIX } from './plugins/media-file';
import { externalPlugin } from './plugins/external';
import { placeholderPlugin } from './plugins/placeholder';
import { runPlugins } from './plugins';

import type { ImageRefPlugin } from './plugins';
import type { Result } from 'neverthrow';

// 本文 Markdown(コードフェンス外の text セグメント)中の `![...](...)` 画像参照を、
// 型付きノード列にパースするミニパーサ。フェンス処理(code-fences)はこのモジュールの
// 責務外 — 呼び出し側が splitCodeFences / mapTextSegments で切り出した text セグメントに
// 対して parseInlineNodes を通す。
//
// スキャンは現行 3 モジュール(media-file-refs / media-placeholders / tools 内の述語)が
// バラバラに再実装していた regex 家族を 1 トークン検出 regex に統合し、検出したトークンを
// prefix-match-processor 形式の plugin registry(first-match、実体は ./plugins 配下)で
// placeholder / mediaFile / external に家族分けする。振る舞い保存が最優先のため、トークン
// 検出 regex・各 family の判定条件は既存モジュールと同一に保つ(文法強化はやらない)。

export type ImageRef = { kind: 'placeholder'; id: number; rawID: string; alt: string } | { kind: 'mediaFile'; filename: string; alt: string } | { kind: 'external'; target: string; alt: string };

export type InlineNode = { kind: 'text'; raw: string } | { kind: 'image'; raw: string; ref: ImageRef };

// フェンス外の image ノード限定型。tools 側(raw ref 収集・hint 生成)が
// text ノードを除いた image ノードだけを扱うために使う。
export type ImageNode = InlineNode & { kind: 'image' };

// デフォルトの family classification registry: placeholder → mediaFile(標準 prefix) → external
// の順(より具体的な family を先に試す。最後の external は必ず ok を返す終端)。
// classifyImageRef / parseInlineNodes は plugins 引数省略時にこれを使う(review L46:
// mediaFile の pathPrefix を利用時注入できるようにした結果、デフォルト registry は
// createMediaFilePlugin(DEFAULT_MEDIA_FILE_PATH_PREFIX) で組み立てる)。
export const DEFAULT_IMAGE_REF_PLUGINS: readonly ImageRefPlugin[] = [placeholderPlugin, createMediaFilePlugin(DEFAULT_MEDIA_FILE_PATH_PREFIX), externalPlugin];

export const classifyImageRef = (raw: string, plugins: readonly ImageRefPlugin[] = DEFAULT_IMAGE_REF_PLUGINS): Result<ImageRef, string> => runPlugins(raw, plugins);

// ===== token scan: text -> InlineNode[] =====

// 既存 3 モジュールが個別に持っていた regex 家族の統合トークン検出。空括弧(プレースホルダの
// alt なし表記)も拾うため `[^)]*`(media-file-refs の `[^)]+` より広い)。
const IMAGE_REF_TOKEN = /!\[[^\]]*\]\(([^)]*)\)/g;

// classifyImageRef は external が終端で必ず ok を返すため、ここでの unwrapOr フォールバックは
// 理論上到達しない(IMAGE_REF_TOKEN でマッチ済みの raw は REF_PARTS にも必ずマッチする)。
const toImageRef = (raw: string, plugins: readonly ImageRefPlugin[]): ImageRef => classifyImageRef(raw, plugins).unwrapOr({ kind: 'external', target: '', alt: '' });

type ScanState = { nodes: InlineNode[]; cursor: number };

const appendMatch =
  (text: string, plugins: readonly ImageRefPlugin[]) =>
  (state: ScanState, match: RegExpMatchArray): ScanState => {
    const start = match.index ?? state.cursor;
    const raw = match[0];
    const before: InlineNode[] = start > state.cursor ? [{ kind: 'text', raw: text.slice(state.cursor, start) }] : [];
    const imageNode: InlineNode = { kind: 'image', raw, ref: toImageRef(raw, plugins) };
    return { nodes: [...state.nodes, ...before, imageNode], cursor: start + raw.length };
  };

// text セグメント(フェンス外)を走査し、![...](...) を ImageRef ノードへ、それ以外を text ノードへ。
// plugins 省略時は DEFAULT_IMAGE_REF_PLUGINS を使う。
export const parseInlineNodes = (text: string, plugins: readonly ImageRefPlugin[] = DEFAULT_IMAGE_REF_PLUGINS): InlineNode[] => {
  const matches = [...text.matchAll(IMAGE_REF_TOKEN)];
  const scanned = matches.reduce(appendMatch(text, plugins), { nodes: [], cursor: 0 });
  const tail: InlineNode[] = scanned.cursor < text.length ? [{ kind: 'text', raw: text.slice(scanned.cursor) }] : [];
  return [...scanned.nodes, ...tail];
};

// ノード列 → markdown 文字列。各ノードは raw(元文字列)を保持しているため、
// parse -> serialize は恒等(未変換ノードは常に raw をそのまま返す)。
export const serializeInlineNodes = (nodes: readonly InlineNode[]): string => nodes.map((node) => node.raw).join('');

// ImageRef → canonical 文字列。placeholder は ![media:<rawID>](<alt>) — rawID は既存表記
// (leading zeros 等)を保つ。alt に ")" を含む場合はこの文法で表現不能 —
// ここが不変条件の一元管理点(呼び出し側は isRoundTrippableAlt で先に検証すること)。
// mediaFile の path prefix は options.mediaFilePathPrefix で上書き可能(省略時は
// DEFAULT_MEDIA_FILE_PATH_PREFIX)。
export const serializeImageRef = (ref: ImageRef, options?: { mediaFilePathPrefix?: string }): string => {
  const mediaFilePathPrefix = options?.mediaFilePathPrefix ?? DEFAULT_MEDIA_FILE_PATH_PREFIX;
  switch (ref.kind) {
    case 'placeholder':
      return `![media:${ref.rawID}](${ref.alt})`;
    case 'mediaFile':
      return `![${ref.alt}](${mediaFilePathPrefix}${encodeURIComponent(ref.filename)})`;
    case 'external':
      return `![${ref.alt}](${ref.target})`;
  }
};

// alt 往復可能性の単一判定源(旧 tools/index.ts から移設。tools 側は Task 2 でこちらを import する)。
export const isRoundTrippableAlt = (alt: string): boolean => !alt.includes(')');

// raw 判定用プリミティブ(Task 2): raw 文字列の括弧内容が非空かを見る。旧
// RAW_IMAGE_REF(`/!\[[^\]]*\]\([^)]+\)/`)の「非空括弧」部分の意味論だけを切り出したもの。
// kind ごとに異なるフィールド(mediaFile の filename / external の target / placeholder の
// rawID)を見るのではなく raw を直接判定することで、全 kind に一様に効かせる —
// ![x]() のような空括弧の非 placeholder 参照を raw 扱いしない、という旧 regex の
// 挙動をここで再現する(呼び出し側は placeholder を別途常に除外すること)。
const RAW_PAREN_CONTENT = /\(([^)]+)\)/;
export const hasNonEmptyParens = (raw: string): boolean => RAW_PAREN_CONTENT.test(raw);
