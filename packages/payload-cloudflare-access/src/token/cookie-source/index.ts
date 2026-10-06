import { err, ok } from 'neverthrow';

import type { TokenSource } from '../types';

const ACCESS_COOKIE_NAME = 'CF_Authorization';

type CookiePair = { name: string; value: string };

const parseCookiePair = (pair: string): CookiePair => {
  const separator = pair.indexOf('=');
  if (separator === -1) return { name: pair, value: '' };

  return { name: pair.slice(0, separator).trim(), value: pair.slice(separator + 1).trim() };
};

export const cookieTokenSource: TokenSource = {
  run: (headers) => {
    const pairs = (headers.get('cookie') ?? '').split(';').map((pair) => parseCookiePair(pair.trim()));
    const found = pairs.find((pair) => pair.name === ACCESS_COOKIE_NAME);
    if (found === undefined || found.value === '') return err(headers);

    return ok({ token: found.value, source: 'cookie' });
  },
};
