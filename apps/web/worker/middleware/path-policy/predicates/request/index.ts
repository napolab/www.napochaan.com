import { allOf, isIn, on } from '../../../../lib/predicate';
import { isCrossSite, isDocumentDest } from '../fetch-metadata';

import type { Predicate } from '../../../../lib/predicate';
import type { PathRequest } from '../../types';

export const byPathname = (predicate: Predicate<string>): Predicate<PathRequest> => on((request: PathRequest) => request.pathname, predicate);

export const byHeaders = (predicate: Predicate<Headers>): Predicate<PathRequest> => on((request: PathRequest) => request.headers, predicate);

export const byMethod = (predicate: Predicate<string>): Predicate<PathRequest> => on((request: PathRequest) => request.method, predicate);

export const isNavigationMethod: Predicate<PathRequest> = byMethod(isIn(['GET', 'HEAD']));

export const isCrossSiteNavigation: Predicate<PathRequest> = allOf(isNavigationMethod, byHeaders(allOf(isCrossSite, isDocumentDest)));
