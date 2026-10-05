export abstract class AccessJWTError extends Error {}

export class InvalidAccessToken extends AccessJWTError {
  override readonly name = 'InvalidAccessToken';

  constructor(cause: unknown) {
    super('Cloudflare Access JWT failed verification', { cause });
  }
}

export class WrongAccessTokenType extends AccessJWTError {
  override readonly name = 'WrongAccessTokenType';

  constructor(readonly tokenType: unknown) {
    super('Cloudflare Access JWT is not an app token');
  }
}

export class MissingAccessEmail extends AccessJWTError {
  override readonly name = 'MissingAccessEmail';

  constructor() {
    super('Cloudflare Access JWT has no email claim');
  }
}

export class ResolveUserError extends Error {
  override readonly name = 'ResolveUserError';

  constructor(cause: unknown) {
    super('Failed to resolve the Payload user for the Cloudflare Access identity', { cause });
  }
}
