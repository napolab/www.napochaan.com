import postcss from 'postcss';
import { describe, expect, it } from 'vitest';

import { woff2Only, woff2OnlySrc } from '.';

describe('woff2OnlySrc', () => {
  it('drops the woff entry of a fontsource woff2 + woff pair', () => {
    const src = "url(./files/m-plus-1-0-400-normal.woff2) format('woff2'), url(./files/m-plus-1-0-400-normal.woff) format('woff')";
    expect(woff2OnlySrc(src)).toBe("url(./files/m-plus-1-0-400-normal.woff2) format('woff2')");
  });

  it('matches the format regardless of quote style', () => {
    expect(woff2OnlySrc('url(a.woff2) format("woff2"), url(a.woff) format("woff")')).toBe('url(a.woff2) format("woff2")');
    expect(woff2OnlySrc('url(a.woff2) format(woff2), url(a.woff) format(woff)')).toBe('url(a.woff2) format(woff2)');
  });

  it('leaves a woff2-only src unchanged', () => {
    expect(woff2OnlySrc("url(a.woff2) format('woff2')")).toBe("url(a.woff2) format('woff2')");
  });

  // Dropping woff is only safe when a woff2 alternative remains.
  it('keeps a woff entry when it is the only web font source', () => {
    expect(woff2OnlySrc("local('X'), url(a.woff) format('woff')")).toBe("local('X'), url(a.woff) format('woff')");
  });

  it('leaves local() sources alone', () => {
    const src = "local('Courier New'), local('CourierNewPSMT')";
    expect(woff2OnlySrc(src)).toBe(src);
    expect(woff2OnlySrc("local('X'), url(a.woff2) format('woff2'), url(a.woff) format('woff')")).toBe("local('X'), url(a.woff2) format('woff2')");
  });

  it('does not split inside url() or quotes', () => {
    const src = 'url("a,b.woff2") format(\'woff2\'), url("a,b.woff") format(\'woff\')';
    expect(woff2OnlySrc(src)).toBe('url("a,b.woff2") format(\'woff2\')');
  });
});

describe('woff2Only (PostCSS plugin)', () => {
  const run = async (css: string) => (await postcss([woff2Only()]).process(css, { from: undefined })).css;

  it('rewrites the src of every @font-face', async () => {
    const css = [
      "@font-face { font-family: 'A'; src: url(a.woff2) format('woff2'), url(a.woff) format('woff'); }",
      "@font-face { font-family: 'B'; src: url(b.woff2) format('woff2'), url(b.woff) format('woff'); }",
    ].join('\n');
    const out = await run(css);
    expect(out).not.toMatch(/format\('woff'\)/);
    expect(out.match(/format\('woff2'\)/g)).toHaveLength(2);
  });

  it('ignores src-like declarations outside @font-face', async () => {
    const css = ".x { src: url(a.woff2) format('woff2'), url(a.woff) format('woff'); }";
    expect(await run(css)).toBe(css);
  });

  it('keeps the metric-matched local() fallback face intact', async () => {
    const css = "@font-face { font-family: 'config-mono-vf Fallback'; src: local('Courier New'), local('CourierNewPSMT'); size-adjust: 99.9837%; }";
    expect(await run(css)).toBe(css);
  });
});
