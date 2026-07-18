import { bodyCheckPlugin } from './body';
import { posterCheckPlugin } from './poster';
import { posterFormatCheckPlugin } from './poster-format';
import { variantCheckPlugin } from './variant';

// 1つの video フェンスの検証に必要な情報。propsOf/attrValue で開始行から取り出した
// props と、そこから読んだ variant を呼び出し側(validateFences)が注入する — plugin は
// 外部状態を読まず、この ctx だけを見る(image-ref の plugin と同じ「利用時注入」原則)。
export type FenceContext = {
  fenceText: string;
  body: string;
  props: string;
  variant: string | undefined;
};

// フェンス検証チェックの契約。ctx を検証し、違反があればメッセージを、なければ
// undefined を返す。image-ref/raw-ref-hints の Plugin<In, Out>(ok/err で「マッチ
// したか」を表す first-match dispatch 契約)とは意図的に別の契約 — こちらは
// dispatch ではなく「違反の有無」を表す述語で、全 plugin が常に評価される
// (下記 runFenceChecks 参照)。Result で表すと ok/err の意味が dispatch 契約と
// 逆転する(ok=違反なし/err=違反、という真逆の極性になる)ため、素朴な
// string | undefined 契約のままにしている。
export interface FenceCheckPlugin {
  run(ctx: FenceContext): string | undefined;
}

export const FENCE_CHECK_PLUGINS: readonly FenceCheckPlugin[] = [bodyCheckPlugin, variantCheckPlugin, posterCheckPlugin, posterFormatCheckPlugin];

// collect-all runner: image-ref の runPlugins(prefix-match, first-match — 最初に
// マッチした1件を採用し残りは評価しない)とは異なり、全 plugin を必ず実行し
// 違反メッセージを全部集める。理由: フェンス検証は「起きている違反を1往復で
// 全部 LLM に伝える」ことが目的で、dispatch のような「最初の一致を採用」だと
// 2つ目以降の違反(例: variant 不正 + poster 不正の同時発生)を見逃す。
export const runFenceChecks = (ctx: FenceContext, plugins: readonly FenceCheckPlugin[] = FENCE_CHECK_PLUGINS): string[] =>
  plugins.map((plugin) => plugin.run(ctx)).filter((error): error is string => error !== undefined);
