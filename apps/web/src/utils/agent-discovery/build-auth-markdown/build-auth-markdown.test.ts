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

  it('says what is not supported', () => {
    expect(markdown).toMatch(/anonymous/i);
    expect(markdown).toContain('ID-JAG');
    expect(markdown).toMatch(/verified-email/i);
  });

  it('follows the deployed origin for this site’s mirrors (staging)', () => {
    expect(buildAuthMarkdown({ baseUrl: 'https://stg.napochaan.com' })).toContain('https://stg.napochaan.com/.well-known/oauth-protected-resource');
  });

  it('ends with a single newline', () => {
    expect(markdown.endsWith('\n')).toBe(true);
    expect(markdown.endsWith('\n\n')).toBe(false);
  });
});
