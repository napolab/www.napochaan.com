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
