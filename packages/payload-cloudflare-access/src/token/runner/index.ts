import { err } from 'neverthrow';

import type { AccessToken, TokenSource } from '../types';
import type { Result } from 'neverthrow';

const run = (headers: Headers, sources: readonly TokenSource[]): Result<AccessToken, Headers> => {
  const [head, ...tail] = sources;
  if (head === undefined) return err(headers);

  const result = head.run(headers);
  if (result.isOk()) return result;

  return run(headers, tail);
};

export const createTokenRunner =
  (sources: readonly TokenSource[]) =>
  (headers: Headers): Result<AccessToken, Headers> =>
    run(headers, sources);
