import type { LogManualItem } from '../../../../app/(site)/log/_lib/log-manual-item';
import type { LogManualItemDTO } from '@napochaan/cms-api/services';

// Maps the cms `LogManualItemDTO` to the site's `LogManualItem` (same shape). Pure.
export const fromLogManualItemDTO = (dto: LogManualItemDTO): LogManualItem => ({ ...dto });
