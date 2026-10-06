import type { Result } from 'neverthrow';

export type AccessTokenSourceName = 'header' | 'cookie';

export type AccessToken = {
  token: string;
  source: AccessTokenSourceName;
};

export type TokenSource = {
  run: (headers: Headers) => Result<AccessToken, Headers>;
};
