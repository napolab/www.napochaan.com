import { equals, on } from '../../../../lib/predicate';

import type { Predicate } from '../../../../lib/predicate';

export const headerIs = (name: string, value: string): Predicate<Headers> => on((headers: Headers) => headers.get(name), equals<string | null>(value));

export const isCrossSite: Predicate<Headers> = headerIs('Sec-Fetch-Site', 'cross-site');

export const isDocumentDest: Predicate<Headers> = headerIs('Sec-Fetch-Dest', 'document');
