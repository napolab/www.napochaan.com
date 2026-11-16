import { describe, expect, it } from 'vitest';

import { mergeAuthorizationServerMetadata, parseAuthorizationServerMetadata, parseOpenIDConfiguration } from './index';

const ISSUER = 'https://napochaan.cloudflareaccess.com';

// Verbatim shape of what Cloudflare Access served on 2026-11-16.
const AS_METADATA = {
  issuer: ISSUER,
  authorization_endpoint: `${ISSUER}/cdn-cgi/access/oauth/authorization`,
  token_endpoint: `${ISSUER}/cdn-cgi/access/oauth/token`,
  response_types_supported: ['code'],
  response_modes_supported: ['query'],
  grant_types_supported: ['authorization_code', 'refresh_token'],
  token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post', 'none'],
  revocation_endpoint: `${ISSUER}/cdn-cgi/access/oauth/revoke`,
  registration_endpoint: `${ISSUER}/cdn-cgi/access/oauth/registration`,
  code_challenge_methods_supported: ['S256'],
};

const OIDC_CONFIGURATION = { issuer: ISSUER, jwks_uri: `${ISSUER}/cdn-cgi/access/certs` };

describe('parseAuthorizationServerMetadata', () => {
  it('accepts RFC 8414 metadata and keeps every upstream member', () => {
    expect(parseAuthorizationServerMetadata(AS_METADATA)).toEqual(AS_METADATA);
  });

  it.each([
    ['not an object', 'x'],
    ['null', null],
    ['an array', [AS_METADATA]],
    ['no issuer', { ...AS_METADATA, issuer: undefined }],
    ['a non-string token endpoint', { ...AS_METADATA, token_endpoint: 1 }],
    ['no authorization endpoint', { ...AS_METADATA, authorization_endpoint: undefined }],
    ['non-string response types', { ...AS_METADATA, response_types_supported: [1] }],
    ['response types that are not an array', { ...AS_METADATA, response_types_supported: 'code' }],
  ])('rejects %s', (_label, value) => {
    expect(parseAuthorizationServerMetadata(value)).toBeUndefined();
  });
});

describe('parseOpenIDConfiguration', () => {
  it('reads the issuer and jwks_uri', () => {
    expect(parseOpenIDConfiguration({ ...OIDC_CONFIGURATION, extra: true })).toEqual(OIDC_CONFIGURATION);
  });

  it.each([
    ['no jwks_uri', { issuer: ISSUER }],
    ['no issuer', { jwks_uri: OIDC_CONFIGURATION.jwks_uri }],
    ['not an object', 'x'],
  ])('rejects %s', (_label, value) => {
    expect(parseOpenIDConfiguration(value)).toBeUndefined();
  });
});

describe('mergeAuthorizationServerMetadata', () => {
  it('adds jwks_uri from the OpenID configuration and keeps the upstream issuer verbatim', () => {
    const merged = mergeAuthorizationServerMetadata({ expectedIssuer: ISSUER, metadata: AS_METADATA, openIDConfiguration: OIDC_CONFIGURATION });
    expect(merged._unsafeUnwrap()).toEqual({ ...AS_METADATA, jwks_uri: `${ISSUER}/cdn-cgi/access/certs` });
  });

  // Mixing documents of two issuers would advertise keys that do not sign this issuer's tokens.
  it('refuses when the two documents name different issuers', () => {
    const merged = mergeAuthorizationServerMetadata({ expectedIssuer: ISSUER, metadata: AS_METADATA, openIDConfiguration: { ...OIDC_CONFIGURATION, issuer: 'https://evil.cloudflareaccess.com' } });
    expect(merged._unsafeUnwrapErr()).toEqual({ kind: 'issuer_mismatch', expected: ISSUER, actual: 'https://evil.cloudflareaccess.com' });
  });

  // The protected resource metadata names ISSUER; any other issuer must not be republished.
  it('refuses metadata of an issuer other than the one the protected resource names', () => {
    const other = 'https://other.cloudflareaccess.com';
    const merged = mergeAuthorizationServerMetadata({ expectedIssuer: ISSUER, metadata: { ...AS_METADATA, issuer: other }, openIDConfiguration: { ...OIDC_CONFIGURATION, issuer: other } });
    expect(merged._unsafeUnwrapErr()).toEqual({ kind: 'issuer_mismatch', expected: ISSUER, actual: other });
  });
});
