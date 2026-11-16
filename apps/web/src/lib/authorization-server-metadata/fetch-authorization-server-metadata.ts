import { errAsync, okAsync, ResultAsync } from 'neverthrow';

import { AUTHORIZATION_SERVER } from '@utils/agent-discovery/facts';
import { mergeAuthorizationServerMetadata, parseAuthorizationServerMetadata, parseOpenIDConfiguration } from '@utils/agent-discovery/merge-authorization-server-metadata';

import type { IssuerMismatch, MergedAuthorizationServerMetadata } from '@utils/agent-discovery/merge-authorization-server-metadata';

// I/O half of the `/.well-known/oauth-authorization-server` proxy: fetch Cloudflare
// Access's RFC 8414 metadata and its OpenID configuration in parallel, narrow both and
// merge them (`@utils/agent-discovery/merge-authorization-server-metadata`). Every way
// upstream can fail is a value, so the route can answer 502 instead of caching garbage.

export type AuthorizationServerMetadataFailure =
  | { kind: 'upstream_unreachable'; url: string }
  | { kind: 'upstream_status'; url: string; status: number }
  | { kind: 'invalid_json'; url: string }
  | { kind: 'invalid_document'; url: string }
  | IssuerMismatch;

const discard = async (response: Response): Promise<void> => {
  await response.body?.cancel();
};

const readJSON = (url: string, response: Response): ResultAsync<unknown, AuthorizationServerMetadataFailure> => {
  if (!response.ok) {
    return ResultAsync.fromSafePromise(discard(response)).andThen(() => errAsync<never, AuthorizationServerMetadataFailure>({ kind: 'upstream_status', url, status: response.status }));
  }

  return ResultAsync.fromPromise<unknown, AuthorizationServerMetadataFailure>(response.json(), () => ({ kind: 'invalid_json', url }));
};

const fetchDocument = <T>(url: string, parse: (value: unknown) => T | undefined): ResultAsync<T, AuthorizationServerMetadataFailure> =>
  ResultAsync.fromPromise<Response, AuthorizationServerMetadataFailure>(fetch(url, { headers: { accept: 'application/json' } }), () => ({ kind: 'upstream_unreachable', url }))
    .andThen((response) => readJSON(url, response))
    .andThen((value) => {
      const document = parse(value);
      if (document === undefined) return errAsync<never, AuthorizationServerMetadataFailure>({ kind: 'invalid_document', url });

      return okAsync(document);
    });

export const fetchAuthorizationServerMetadata = (): ResultAsync<MergedAuthorizationServerMetadata, AuthorizationServerMetadataFailure> =>
  ResultAsync.combine([
    fetchDocument(AUTHORIZATION_SERVER.metadataURL, parseAuthorizationServerMetadata),
    fetchDocument(AUTHORIZATION_SERVER.openIDConfigurationURL, parseOpenIDConfiguration),
  ] as const).andThen(([metadata, openIDConfiguration]) => mergeAuthorizationServerMetadata({ expectedIssuer: AUTHORIZATION_SERVER.issuer, metadata, openIDConfiguration }));
