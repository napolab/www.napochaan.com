import { anyOf, on } from '../../../lib/predicate';
import { safeDecodePathname } from '../../path-policy/safe-decode-pathname';

import type { Predicate } from '../../../lib/predicate';

// Next resolves `/%62log/preview` to the same route as `/blog/preview`, so a path test that guards
// privacy or freshness must hold for the decoded pathname too — otherwise an encoded
// URL slips past it into the long-lived public cms policy.
export const orDecoded = (predicate: Predicate<string>): Predicate<string> => anyOf(predicate, on(safeDecodePathname, predicate));
