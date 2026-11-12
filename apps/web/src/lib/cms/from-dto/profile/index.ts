import { parseLexicalJSON } from '../lexical';

import type { Profile } from '../../../../app/(site)/about/_lib/profile';
import type { ProfileDTO } from '@napochaan/cms-api/services';

// Maps the cms `ProfileDTO` to the site's `Profile`, restoring `bioJSON` /
// `philosophyJSON` to editor states. Absent rich text stays absent. Pure.
export const fromProfileDTO = ({ bioJSON, philosophyJSON, ...dto }: ProfileDTO): Profile => {
  const bio = parseLexicalJSON(bioJSON);
  const philosophy = parseLexicalJSON(philosophyJSON);

  return {
    ...dto,
    ...(bio === undefined ? {} : { bio }),
    ...(philosophy === undefined ? {} : { philosophy }),
  };
};
