import { describe, expect, it } from 'vitest';

import { buildAuthMarkdown } from './index';

const markdown = buildAuthMarkdown({ baseUrl: 'https://napochaan.com' });

const ISSUER = 'https://napochaan.cloudflareaccess.com';

describe('buildAuthMarkdown', () => {
  it('opens with an H1 that contains auth.md (scanner detection)', () => {
    expect(markdown.split('\n')[0]).toBe('# napochaan.com auth.md');
  });

  it('separates the public site (no auth) from the owner-only MCP server', () => {
    expect(markdown).toContain('No authentication is needed to read napochaan.com');
    expect(markdown).toMatch(/only the site owner/i);
  });

  it('names the protected resource and its endpoint', () => {
    expect(markdown).toContain('`https://mcp.napochaan.com`');
    expect(markdown).toContain('`https://mcp.napochaan.com/mcp`');
  });

  it('lists the discovery documents (both PRM copies and the AS metadata)', () => {
    expect(markdown).toContain('https://mcp.napochaan.com/.well-known/oauth-protected-resource');
    expect(markdown).toContain('https://napochaan.com/.well-known/oauth-protected-resource');
    expect(markdown).toContain(`${ISSUER}/.well-known/oauth-authorization-server`);
    expect(markdown).toContain('https://napochaan.com/.well-known/oauth-authorization-server');
  });

  it('documents registration, the supported method, credential use and revocation', () => {
    expect(markdown).toContain('RFC 7591');
    expect(markdown).toContain(`\`${ISSUER}/cdn-cgi/access/oauth/registration\``);
    expect(markdown).toContain('`authorization_code`');
    expect(markdown).toContain('`S256`');
    expect(markdown).toContain('`refresh_token`');
    expect(markdown).toContain(`\`${ISSUER}/cdn-cgi/access/oauth/authorization\``);
    expect(markdown).toContain(`\`${ISSUER}/cdn-cgi/access/oauth/token\``);
    expect(markdown).toContain('Authorization: Bearer <access_token>');
    expect(markdown).toContain(`\`${ISSUER}/cdn-cgi/access/oauth/revoke\``);
  });

  it('says in plain prose that agentic self-registration and static credentials are not offered', () => {
    expect(markdown).toMatch(/agentic self-registration is not offered/i);
    expect(markdown).toContain('API keys or other static credentials');
  });

  it('names the Dynamic Client Registration URL as the only registration endpoint', () => {
    expect(markdown).toContain(`Registration endpoint: \`${ISSUER}/cdn-cgi/access/oauth/registration\``);
    expect(markdown).toContain(`POST ${ISSUER}/cdn-cgi/access/oauth/registration`);
    expect(markdown).not.toContain('POST https://mcp.napochaan.com/mcp');
  });

  it('shows the Bearer request to the MCP endpoint without an absolute URL after the verb', () => {
    expect(markdown).toContain(['POST /mcp HTTP/1.1', 'Host: mcp.napochaan.com', 'Authorization: Bearer <access_token>'].join('\n'));
  });

  // Auth.md scanners keyword-match these to detect agentic registration flows (agent_auth
  // metadata, ID-JAG, verified email, anonymous). This site offers none of them, so the
  // document must not mention them, not even to deny support.
  const LITERAL_MARKERS = [
    'agent_auth',
    'register_uri',
    'claim_uri',
    'claim_token',
    'identity_types_supported',
    'assertion_types_supported',
    'credential_types_supported',
    'service_auth',
    'urn:ietf:params:oauth:token-type',
    'jwt-bearer',
    '/agent/identity',
    '/agent/auth',
  ] as const;

  it.each(LITERAL_MARKERS)('contains no agentic-registration marker %s', (marker) => {
    expect(markdown.toLowerCase()).not.toContain(marker);
  });

  // Separator-insensitive: `ID-JAG`, `id_jag`, `Verified email`, `email-verified` all collapse.
  const NORMALIZED_MARKERS = ['anonymous', 'idjag', 'identityassertion', 'verifiedemail', 'emailverified'] as const;

  it.each(NORMALIZED_MARKERS)('contains no agentic-registration flow name %s in any spelling', (marker) => {
    expect(markdown.toLowerCase().replaceAll(/[\s_-]/g, '')).not.toContain(marker);
  });

  it('follows the deployed origin for this site’s mirrors (staging)', () => {
    expect(buildAuthMarkdown({ baseUrl: 'https://stg.napochaan.com' })).toContain('https://stg.napochaan.com/.well-known/oauth-protected-resource');
  });

  it('ends with a single newline', () => {
    expect(markdown.endsWith('\n')).toBe(true);
    expect(markdown.endsWith('\n\n')).toBe(false);
  });
});
