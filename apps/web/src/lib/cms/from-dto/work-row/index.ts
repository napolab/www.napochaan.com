import { parseLexicalJSON } from '../lexical';

import type { WorkRow } from '../../../../app/(site)/works/_lib/work-row';
import type { WorkRowDTO } from '@napochaan/cms-api/services';

// Maps the cms `WorkRowDTO` to the site's `WorkRow`, restoring `bodyJSON` to
// `body`. Absent optional fields stay absent. Pure.
export const fromWorkRowDTO = ({ bodyJSON, ...dto }: WorkRowDTO): WorkRow => {
  const body = parseLexicalJSON(bodyJSON);

  return { ...dto, ...(body === undefined ? {} : { body }) };
};
