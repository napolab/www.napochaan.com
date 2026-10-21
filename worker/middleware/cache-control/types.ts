import type { Plugin } from '../../lib/first-match-runner';

// 入力は percent-decode しない pathname、値は Cache-Control ヘッダ値。
export type CacheControlPlugin = Plugin<string, string>;
