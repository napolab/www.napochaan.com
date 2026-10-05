import { cookieTokenSource } from './cookie-source';
import { headerTokenSource } from './header-source';
import { createTokenRunner } from './runner';

// The registry is internal to the package: the order is header -> cookie (first match wins).
const sources = [headerTokenSource, cookieTokenSource] as const;

export const extractAccessToken = createTokenRunner(sources);
