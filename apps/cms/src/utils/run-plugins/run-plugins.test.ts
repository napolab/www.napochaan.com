import { err, ok } from 'neverthrow';
import { describe, expect, it } from 'vitest';

import { runPlugins } from '.';

import type { Plugin } from '.';

// 旧 src/lib/mcp/markdown/image-ref/plugins/plugins.test.ts からの移設。
// runner は汎用型引数で動くため、テストも具体 family に依存しない string -> string で固定する。
type TestPlugin = Plugin<string, string>;

describe('runPlugins', () => {
  it('returns the first plugin that matches (ok)', () => {
    const first: TestPlugin = { run: () => ok('first') };
    const second: TestPlugin = { run: () => ok('second') };
    expect(runPlugins('raw', [first, second])).toEqual(ok('first'));
  });

  it('falls through to the next plugin on err', () => {
    const first: TestPlugin = { run: (raw) => err(raw) };
    const second: TestPlugin = { run: () => ok('second') };
    expect(runPlugins('raw', [first, second])).toEqual(ok('second'));
  });

  it('propagates the original input as the error when every plugin errs', () => {
    const first: TestPlugin = { run: (raw) => err(raw) };
    const second: TestPlugin = { run: (raw) => err(raw) };
    expect(runPlugins('raw-value', [first, second])).toEqual(err('raw-value'));
  });

  it('errs with the input for an empty plugin list', () => {
    expect(runPlugins('raw-value', [])).toEqual(err('raw-value'));
  });
});
