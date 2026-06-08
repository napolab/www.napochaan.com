import config from '@payload-config';
import { getPayload } from 'payload';

import type { Payload } from 'payload';

// Memoize the init promise at module scope so every query helper reuses a single
// Payload instance across requests within the same worker isolate, instead of
// re-initialising (and re-opening the D1 connection) on every call.
const cached: Promise<Payload> = getPayload({ config });

export const getPayloadClient = async (): Promise<Payload> => cached;
