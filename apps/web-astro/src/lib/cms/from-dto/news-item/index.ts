import { parseLexicalJSON } from '../lexical';

import type { NewsItem } from '../../../../features/news/news-item';
import type { NewsItemDTO } from '@napochaan/cms-api/services';

// Maps the cms `NewsItemDTO` to the site's `NewsItem`, restoring `bodyJSON` to
// `body`. Absent optional fields stay absent. Pure.
export const fromNewsItemDTO = ({ bodyJSON, ...dto }: NewsItemDTO): NewsItem => {
  const body = parseLexicalJSON(bodyJSON);

  return { ...dto, ...(body === undefined ? {} : { body }) };
};
