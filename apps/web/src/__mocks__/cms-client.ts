import { hc } from 'hono/client';

import { createFakeCMSBinding } from './cms-services';

import type { CMSClient } from '@lib/cms/client';
import type { CMSAppType } from '@napochaan/cms-api/app';

// Browser-test stand-in for `@lib/cms/client` (aliased in vitest.config.ts).
// The real module reads the Service Binding from the per-request context
// (src/lib/request-context), which does not exist in the browser. This client
// talks to the cms Hono app in-process over fixture services instead. Component
// tests normally mock the `@lib/cms/<collection>` helper itself.
export const getCMSClient = (): CMSClient => hc<CMSAppType>('https://cms.internal', { fetch: createFakeCMSBinding().fetch });
