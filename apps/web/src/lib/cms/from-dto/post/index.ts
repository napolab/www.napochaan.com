import { parseLexicalJSON } from '../lexical';

import type { Post } from '../../../../app/(site)/blog/_lib/post';
import type { PostDTO } from '@napochaan/cms-api/services';

// Maps the cms `PostDTO` to the site's `Post`, restoring `bodyJSON` to `body`.
// Absent optional fields stay absent (no `key: undefined`). Pure.
export const fromPostDTO = ({ bodyJSON, ...dto }: PostDTO): Post => {
  const body = parseLexicalJSON(bodyJSON);

  return { ...dto, ...(body === undefined ? {} : { body }) };
};
