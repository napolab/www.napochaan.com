// Personal Agent Protocol (Poppy) draft 0.1 discovery, `/.well-known/poppy.json`:
// website-only — no agent / API / browser-session interfaces are declared, so no
// `auth.issuer` is needed. `organization.domain` must match the requested host.
// https://personalagentprotocol.org/docs/spec#3-discovery

export type PoppyDiscovery = {
  protocol_version: '0.1';
  organization: { name: string; domain: string };
  web: Record<string, never>;
};

type BuildPoppyDiscoveryArgs = { baseUrl: string };

export const buildPoppyDiscovery = ({ baseUrl }: BuildPoppyDiscoveryArgs): PoppyDiscovery => ({
  protocol_version: '0.1',
  organization: { name: 'napochaan', domain: new URL(baseUrl).host },
  web: {},
});
