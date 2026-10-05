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

export class CrossSiteCookieRequest extends Error {
  override readonly name = 'CrossSiteCookieRequest';

  constructor() {
    super('Cloudflare Access cookie was sent on a cross-site request');
  }
}

export class AccessTargetCollectionNotFound extends Error {
  override readonly name = 'AccessTargetCollectionNotFound';

  constructor(readonly slug: string | undefined) {
    super(
      slug === undefined
        ? 'Cloudflare Access is configured but no auth collection exists to attach it to. Set `admin.user` or pass `collection` to cloudflareAccessPlugin.'
        : `Cloudflare Access is configured but "${slug}" is not an auth collection in the Payload config. Fix \`admin.user\` / the plugin \`collection\` option, or unset CF_ACCESS_TEAM_DOMAIN / CF_ACCESS_AUD to disable the plugin.`,
    );
  }
}
