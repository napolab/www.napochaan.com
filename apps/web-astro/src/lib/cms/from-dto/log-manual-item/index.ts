import type { LogManualItem } from '../../../../features/log/log-manual-item';
import type { LogManualItemDTO } from '@napochaan/cms-api/services';

// Maps the cms `LogManualItemDTO` to the site's `LogManualItem` (same shape). Pure.
export const fromLogManualItemDTO = (dto: LogManualItemDTO): LogManualItem => ({ ...dto });
