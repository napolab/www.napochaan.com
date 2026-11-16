// Pure half of the `/.well-known/oauth-authorization-server` proxy: narrow the two
// documents Cloudflare Access publishes and merge them.
//
// Access's RFC 8414 metadata has no `jwks_uri` (agent-readiness scanners require one);
// its OpenID configuration has it. The merge is the AS metadata, unchanged, plus that
// `jwks_uri` — only when both documents name the issuer the protected resource metadata
// advertises. `issuer` is republished exactly as upstream sent it (never rewritten to this
// site's origin), so clients validate tokens against the real issuer.

import { err, ok } from 'neverthrow';

import type { Result } from 'neverthrow';

// Upstream members are passed through untouched (RFC 8414 allows extensions), so the
// type keeps unknown members next to the ones this module checks.
export type AuthorizationServerMetadata = Readonly<Record<string, unknown>> & {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  response_types_supported: string[];
};

export type OpenIDConfiguration = { issuer: string; jwks_uri: string };

export type MergedAuthorizationServerMetadata = AuthorizationServerMetadata & { jwks_uri: string };

export type IssuerMismatch = { kind: 'issuer_mismatch'; expected: string; actual: string };

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

const isString = (value: unknown): value is string => typeof value === 'string';

const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every(isString);

export const parseAuthorizationServerMetadata = (value: unknown): AuthorizationServerMetadata | undefined => {
  if (!isRecord(value)) return undefined;
  const { issuer, authorization_endpoint, token_endpoint, response_types_supported } = value;
  if (!isString(issuer) || !isString(authorization_endpoint) || !isString(token_endpoint)) return undefined;
  if (!isStringArray(response_types_supported)) return undefined;

  return { ...value, issuer, authorization_endpoint, token_endpoint, response_types_supported };
};

export const parseOpenIDConfiguration = (value: unknown): OpenIDConfiguration | undefined => {
  if (!isRecord(value)) return undefined;
  const { issuer, jwks_uri } = value;
  if (!isString(issuer) || !isString(jwks_uri)) return undefined;

  return { issuer, jwks_uri };
};

type MergeArgs = {
  expectedIssuer: string;
  metadata: AuthorizationServerMetadata;
  openIDConfiguration: OpenIDConfiguration;
};

const findForeignIssuer = ({ expectedIssuer, metadata, openIDConfiguration }: MergeArgs): string | undefined =>
  [metadata.issuer, openIDConfiguration.issuer].find((issuer) => issuer !== expectedIssuer);

export const mergeAuthorizationServerMetadata = (args: MergeArgs): Result<MergedAuthorizationServerMetadata, IssuerMismatch> => {
  const foreign = findForeignIssuer(args);
  if (foreign !== undefined) return err({ kind: 'issuer_mismatch', expected: args.expectedIssuer, actual: foreign });

  return ok({ ...args.metadata, jwks_uri: args.openIDConfiguration.jwks_uri });
};
