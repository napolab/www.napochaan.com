import { isBuildPhase } from '../build-phase';
import { getCMSClient } from '@lib/cms/client';
import { fromLogManualItemDTO } from '../from-dto/log-manual-item';
import { assertOK } from '../response-error';

import type { LogManualItem } from '../../../app/(site)/log/_lib/log-manual-item';

// Published manual log entries, newest first. Non-2xx throws.
export const findLogList = async (): Promise<readonly LogManualItem[]> => {
  if (isBuildPhase()) return [];

  const cms = await getCMSClient();
  const res = await cms.logs.$get();
  assertOK('GET /logs', res);

  return (await res.json()).map(fromLogManualItemDTO);
};

// Every entry at its latest draft, gated by the preview secret on the cms side.
// Only reachable from the draft-mode preview route. 403 (wrong secret) → [].
export const findLogDraftList = async (previewSecret: string): Promise<readonly LogManualItem[]> => {
  if (isBuildPhase()) return [];

  const cms = await getCMSClient();
  const res = await cms.drafts.logs.$get({ header: { 'x-preview-secret': previewSecret } });
  if (res.status === 403) return [];
  assertOK('GET /drafts/logs', res);

  return (await res.json()).map(fromLogManualItemDTO);
};
