import { describe, expect, test } from 'vitest';

import { isAllowedCookieRequest, isAllowedHeaderRequest } from './index';

const csrf = ['https://napochaan.com'];

// Pins the cookie CSRF decision table of Payload 3.84.1 (`dist/auth/extractJWT.js`, the `cookie`
// extraction method): Origin allowlist first, then no-allowlist passthrough, then Sec-Fetch-Site.
describe('isAllowedCookieRequest', () => {
  test('allows a listed Origin', () => {
    expect(isAllowedCookieRequest(new Headers({ Origin: 'https://napochaan.com' }), csrf)).toBe(true);
  });

  test('rejects an unlisted Origin', () => {
    expect(isAllowedCookieRequest(new Headers({ Origin: 'https://evil.example' }), csrf)).toBe(false);
  });

  test('allows any Origin when csrf is empty', () => {
    expect(isAllowedCookieRequest(new Headers({ Origin: 'https://evil.example' }), [])).toBe(true);
  });

  test('allows same-origin fetch without Origin', () => {
    expect(isAllowedCookieRequest(new Headers({ 'Sec-Fetch-Site': 'same-origin' }), csrf)).toBe(true);
  });

  test('allows same-site fetch without Origin', () => {
    expect(isAllowedCookieRequest(new Headers({ 'Sec-Fetch-Site': 'same-site' }), csrf)).toBe(true);
  });

  test('allows direct navigation without Origin', () => {
    expect(isAllowedCookieRequest(new Headers({ 'Sec-Fetch-Site': 'none' }), csrf)).toBe(true);
  });

  test('rejects cross-site fetch without Origin', () => {
    expect(isAllowedCookieRequest(new Headers({ 'Sec-Fetch-Site': 'cross-site' }), csrf)).toBe(false);
  });

  test('rejects a request with neither Origin nor Sec-Fetch-Site', () => {
    expect(isAllowedCookieRequest(new Headers(), csrf)).toBe(false);
  });
});

// Access は Cf-Access-Jwt-Assertion をブラウザの CF_Authorization cookie から付けるので、header 由来でも
// クロスサイト要求に乗ってくる。ただし Access のログイン後の着地や claude.ai からの /oauth/authorize は
// Origin の無いクロスサイトのトップレベル GET なので、cookie の判定表をそのまま使うと正規の経路が落ちる。
type HeaderCase = { flow: string; headers: Record<string, string> };

describe('isAllowedHeaderRequest', () => {
  test.each<HeaderCase>([
    {
      flow: 'Access login callback landing on /admin (top-level cross-site GET)',
      headers: { 'Sec-Fetch-Site': 'cross-site', 'Sec-Fetch-Mode': 'navigate', 'Sec-Fetch-Dest': 'document' },
    },
    {
      flow: 'claude.ai popup to /oauth/authorize (top-level cross-site GET)',
      headers: { 'Sec-Fetch-Site': 'cross-site', 'Sec-Fetch-Mode': 'navigate', 'Sec-Fetch-Dest': 'document' },
    },
    { flow: 'admin same-origin XHR GET without Origin', headers: { 'Sec-Fetch-Site': 'same-origin', 'Sec-Fetch-Dest': 'empty' } },
    { flow: 'Live Preview same-origin iframe', headers: { 'Sec-Fetch-Site': 'same-origin', 'Sec-Fetch-Dest': 'iframe' } },
    { flow: 'admin same-origin thumbnail <img>', headers: { 'Sec-Fetch-Site': 'same-origin', 'Sec-Fetch-Dest': 'image' } },
    { flow: 'admin same-origin XHR POST / PATCH', headers: { Origin: 'https://napochaan.com', 'Sec-Fetch-Site': 'same-origin', 'Sec-Fetch-Dest': 'empty' } },
    { flow: 'Server Action POST', headers: { Origin: 'https://napochaan.com', 'Sec-Fetch-Site': 'same-origin', 'Sec-Fetch-Dest': 'empty' } },
    { flow: 'non-browser client (curl) without fetch metadata', headers: {} },
    { flow: 'direct navigation typed into the address bar', headers: { 'Sec-Fetch-Site': 'none', 'Sec-Fetch-Dest': 'document' } },
  ])('allows $flow', ({ headers }) => {
    expect(isAllowedHeaderRequest(new Headers(headers), csrf)).toBe(true);
  });

  test.each<HeaderCase>([
    { flow: 'cross-site form / fetch POST', headers: { Origin: 'https://evil.example', 'Sec-Fetch-Site': 'cross-site', 'Sec-Fetch-Dest': 'document' } },
    { flow: 'redirect-tainted request with Origin: null', headers: { Origin: 'null', 'Sec-Fetch-Site': 'cross-site', 'Sec-Fetch-Dest': 'document' } },
    { flow: 'cross-site <img>', headers: { 'Sec-Fetch-Site': 'cross-site', 'Sec-Fetch-Dest': 'image' } },
    { flow: 'cross-site <iframe>', headers: { 'Sec-Fetch-Site': 'cross-site', 'Sec-Fetch-Dest': 'iframe' } },
    { flow: 'cross-site <script>', headers: { 'Sec-Fetch-Site': 'cross-site', 'Sec-Fetch-Dest': 'script' } },
    { flow: 'cross-site no-cors fetch GET', headers: { 'Sec-Fetch-Site': 'cross-site', 'Sec-Fetch-Dest': 'empty' } },
    { flow: 'cross-site request with Sec-Fetch-Site but no Sec-Fetch-Dest', headers: { 'Sec-Fetch-Site': 'cross-site' } },
  ])('rejects $flow', ({ headers }) => {
    expect(isAllowedHeaderRequest(new Headers(headers), csrf)).toBe(false);
  });

  test('allows any Origin when csrf is empty', () => {
    expect(isAllowedHeaderRequest(new Headers({ Origin: 'https://evil.example' }), [])).toBe(true);
  });

  test('still rejects a cross-site subresource when csrf is empty', () => {
    expect(isAllowedHeaderRequest(new Headers({ 'Sec-Fetch-Site': 'cross-site', 'Sec-Fetch-Dest': 'image' }), [])).toBe(false);
  });
});
