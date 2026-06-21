import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';

import type { SoftwareDownload, SoftwareRelease } from './index';

// Wire shapes from Payload local API (NULLs allowed). Coerced to the domain types,
// which use `T?` only (function-arg-types.md).
type ReleaseDoc = { id: number | string; version: string; releasedAt: string; changelog?: string | null; filename?: string | null };
type SoftwareDoc = { id: number | string; name: string; summary: string; terms: SerializedEditorState };

export const toSoftwareRelease = (doc: ReleaseDoc): SoftwareRelease => ({
  id: `${doc.id}`,
  version: doc.version,
  releasedAt: doc.releasedAt,
  changelog: doc.changelog === null || doc.changelog === undefined || doc.changelog === '' ? undefined : doc.changelog,
  filename: doc.filename ?? '',
});

export const toSoftwareDownload = (doc: SoftwareDoc, latest: SoftwareRelease, history: readonly SoftwareRelease[]): SoftwareDownload => ({
  id: `${doc.id}`,
  name: doc.name,
  summary: doc.summary,
  terms: doc.terms,
  latest,
  history,
});
