import { err, ok } from 'neverthrow';

import { runPlugins } from '@utils/run-plugins';

import type { ImageNode } from '../../markdown/image-ref';
import type { Plugin } from '@utils/run-plugins';

// filename → media doc の対応表 1 件分(tools/index.ts の FindMediaByFilename が返す形と同じ)。
// tools/index.ts はこれをここから import する(旧: tools/index.ts にローカル定義)。
export type MediaHit = { id: number; alt: string };

type HintPlugin = Plugin<ImageNode, string>;

// 生 URL 画像 1 件分の回復指示メッセージを生成する prefix-match-processor 形式の
// plugin 群。first-match(most-specific first): mediaFile+hit -> mediaFile 不在 ->
// それ以外(external)は必ずマッチする終端。文言は旧 tools/index.ts の rawRefHint と
// バイト同一(tools.test.ts の inline snapshot が固定している)。
//
// hitByFilename(呼び出し元の 1 回の検証で見つかった media 対応表)は plugin 外部の
// 状態として引き回さず、各 plugin が構築時にクロージャで持つ(review: 「plugin 外に
// 状態を持ちたくない」)。media-file/index.ts の createMediaFilePlugin(pathPrefix) と
// 同じ「利用時注入」パターン。

const resolvedMediaFileHintMessage = (raw: string, hit: MediaHit): string => `- ${raw}: media id=${hit.id} の画像です。![media:${hit.id}](${hit.alt}) に置き換えて再送してください。`;

// mediaFile ref で、かつ対応する media が見つかった場合。alt 入りの具体的な
// 置き換え先まで提示し、LLM が 1 往復でそのまま貼り戻せるようにする。
export const createResolvedMediaFileHintPlugin = (hitByFilename: ReadonlyMap<string, MediaHit>): HintPlugin => ({
  run(node) {
    if (node.ref.kind !== 'mediaFile') return err(node);
    const hit = hitByFilename.get(node.ref.filename);
    if (hit === undefined) return err(node);
    return ok(resolvedMediaFileHintMessage(node.raw, hit));
  },
});

const missingMediaFileHintMessage = (raw: string, filename: string): string =>
  `- ${raw}: 対応する media(${filename})が見つかりません。upload_media で登録し、返された placeholder(![media:<id>](alt))をそのまま貼ってください。`;

// mediaFile ref だが、対応する media が見つからない場合。
export const createMissingMediaFileHintPlugin = (hitByFilename: ReadonlyMap<string, MediaHit>): HintPlugin => ({
  run(node) {
    if (node.ref.kind !== 'mediaFile') return err(node);
    if (hitByFilename.get(node.ref.filename) !== undefined) return err(node);
    return ok(missingMediaFileHintMessage(node.raw, node.ref.filename));
  },
});

const externalHintMessage = (raw: string): string => `- ${raw}: 外部 URL は使えません。upload_media で画像を登録し、返された placeholder(![media:<id>](alt))をそのまま貼ってください。`;

// 終端 plugin: mediaFile 以外(external, および理論上到達しない placeholder)は常にこれで拾う。
// hitByFilename に依存しないため状態を持たず、ファクトリ不要のまま plain const でよい。
export const externalHintPlugin: HintPlugin = {
  run(node) {
    return ok(externalHintMessage(node.raw));
  },
};

// registry factory: most-specific first。externalHintPlugin が必ず ok を返す終端のため、
// createRawRefHint が返す関数は runPlugins の err 分岐に理論上到達しない。
export const createRawRefHintPlugins = (hitByFilename: ReadonlyMap<string, MediaHit>): readonly HintPlugin[] => [
  createResolvedMediaFileHintPlugin(hitByFilename),
  createMissingMediaFileHintPlugin(hitByFilename),
  externalHintPlugin,
];

// raw ref 群の回復指示を生成する関数を 1 個作る。呼び出し元(validateBodyMarkdown)は
// 複数 ImageNode を同じ hitByFilename で処理するため、registry の構築(plugin 群の
// クロージャ生成)を 1 回だけ行い、返された関数を .map に渡す。externalHintPlugin が
// 終端(常に ok)のため全域関数として扱ってよい — fallback は同じ文言を生成する
// externalHintMessage を直接使い、二重評価や unsafe unwrap を避ける。
export const createRawRefHint = (hitByFilename: ReadonlyMap<string, MediaHit>): ((node: ImageNode) => string) => {
  const plugins = createRawRefHintPlugins(hitByFilename);
  return (node) => runPlugins(node, plugins).unwrapOr(externalHintMessage(node.raw));
};
