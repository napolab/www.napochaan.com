import { describe, expect, it } from 'vitest';

import { createFakeCMSBinding } from '../../../__mocks__/cms-services';
import { runWithRequestContext } from '../../request-context';

import { getCMSClient } from './index';

const withEnv = <T>(env: Partial<Cloudflare.Env>, fn: () => T): T => runWithRequestContext({ env: env as Cloudflare.Env, ctx: undefined, request: new Request('http://localhost/') }, fn);

describe('getCMSClient', () => {
  it('builds a client over the request context CMS binding', async () => {
    const cms = withEnv({ CMS: createFakeCMSBinding() as unknown as Cloudflare.Env['CMS'] }, () => getCMSClient());
    const res = await cms.blog.$get();
    expect(res.status).toBe(200);
  });

  it('throws a clear error when the CMS binding is missing', () => {
    expect(() => withEnv({}, () => getCMSClient())).toThrow(/CMS service binding is not configured/);
  });

  it('throws outside a request', () => {
    expect(() => getCMSClient()).toThrow('request context is not available outside a request');
  });
});
