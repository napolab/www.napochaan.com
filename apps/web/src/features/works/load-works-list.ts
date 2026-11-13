import { findWorksList } from '@lib/cms/works';

import { paginateWorks } from './lib/paginate-works';

import type { WorksPage } from './lib/paginate-works';

// One page of the published archive; `undefined` past the last page (the route's 404).
export const loadWorksList = async (page: number): Promise<WorksPage | undefined> => paginateWorks(await findWorksList(), page);
