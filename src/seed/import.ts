import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import payload from 'payload';

import { applyResolvedMedia, collectUploadSentinels } from './resolve-body-media';

import type { Blog, LegalDocument, Log, News, Work } from '@payload-types';
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';
import type { Payload, SanitizedConfig } from 'payload';

type UpsertCollection = 'news' | 'works' | 'blog' | 'legal-documents';

// Reads src/seed/data/*.json (produced by `seed:export`, or hand-edited) and
// upserts every collection + the profile global. Idempotent: re-running must not
// duplicate rows. `disableRevalidate` no-ops the collection revalidate hooks —
// there is no Next request context during a bin script.

const dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(dirname, 'data');
const assetsDir = path.resolve(dirname, 'assets');

const ADMIN_EMAIL = process.env.PAYLOAD_SEED_EMAIL ?? 'dev@napochaan.com';
const ADMIN_PASSWORD = process.env.PAYLOAD_SEED_PASSWORD ?? 'password';

const writeContext = { disableRevalidate: true } as const;

// Lexical richText: the JSON body matches Payload's generated body shape (which
// carries an index signature), so coerce once at this write boundary.
type RichText = News['body'];
const asRichText = (value: unknown): RichText => value as unknown as RichText;

const isPlainObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

const readData = async <T>(name: string): Promise<readonly T[]> => {
  const raw = await readFile(path.resolve(dataDir, `${name}.json`), 'utf8');
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error(`[seed:import] ${name}.json is not a JSON array`);
  return parsed as readonly T[];
};

// ---------------------------------------------------------------------------
// Admin user (idempotent). Only the dev seed path (`payload:seed` / `seed:import`)
// calls this — the production initial seed (`seed:import:prod`) runs content only
// and never seeds a user, so no weak credentials reach production (see import-prod.ts).
// Exported so the production-safety invariant can be tested directly.
// ---------------------------------------------------------------------------
export const ensureAdminUser = async (instance: Payload): Promise<void> => {
  const existing = await instance.find({ collection: 'users', where: { email: { equals: ADMIN_EMAIL } }, limit: 1 });
  if (existing.docs.length > 0) {
    instance.logger.info(`[seed:import] admin user already exists: ${ADMIN_EMAIL}`);
    return;
  }
  const created = await instance.create({ collection: 'users', data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD, name: 'napochaan admin' } });
  instance.logger.info(`[seed:import] created admin user: ${ADMIN_EMAIL} (id=${created.id})`);
};

// ---------------------------------------------------------------------------
// Media resolution: find a file by name anywhere under src/seed/assets, then
// find-or-create its media row. Returns the media id, or undefined if the file
// is missing (caller leaves the relationship unset rather than crashing).
// ---------------------------------------------------------------------------
const findAssetPath = async (filename: string): Promise<string | undefined> => {
  const entries = await readdir(assetsDir, { recursive: true, withFileTypes: true });
  const match = entries.find((entry) => entry.isFile() && entry.name === filename);
  if (match === undefined) return undefined;
  return path.resolve(match.parentPath, match.name);
};

// (Re-)upload the binary for an EXISTING media doc when its R2 object is missing
// OR its stored content differs from the local asset. A media row in D1 does not
// guarantee correct bytes in R2: e.g. a seed run before the R2 binding was
// `remote = true` wrote the doc to remote D1 but the upload to local miniflare, so
// the deployed worker 404s the file; and editing an asset while keeping the same
// filename (e.g. swapping a thumbnail) leaves stale bytes in R2 unless we compare
// content. We head the bucket first and compare hashes: single-part R2 puts (how
// both the storage-r2 plugin and this code write objects) store the content MD5
// hex in `head.etag` (defensively unquoted), so we compute the local bytes' MD5
// and skip the upload only when an object exists AND the hashes match — otherwise
// we put. `r2Bucket` is imported lazily, inside this found-branch only, so the unit
// test (find() returns no docs) never loads payload.config — and at runtime it is
// the already-evaluated config singleton, resolved to the remote bucket under
// `CLOUDFLARE_ENV=staging|production`.
// Exported so the content-aware re-upload behavior can be tested directly.
export const ensureMediaBytes = async (instance: Payload, filename: string, filePath: string, contentType: string | undefined): Promise<void> => {
  const { r2Bucket } = await import('../payload.config');
  const head = await r2Bucket.head(filename);
  const bytes = await readFile(filePath);
  const localHash = createHash('md5').update(bytes).digest('hex');
  const storedHash = head === null ? undefined : head.etag.replace(/^"|"$/g, '');
  if (head !== null && storedHash === localHash) return;
  await r2Bucket.put(filename, bytes, contentType === undefined ? undefined : { httpMetadata: { contentType } });
  instance.logger.info(`[seed:import] uploaded R2 object (new or changed): ${filename}`);
};

const ensureMedia = async (instance: Payload, filename: string, alt: string): Promise<number | undefined> => {
  const existing = await instance.find({ collection: 'media', where: { filename: { equals: filename } }, limit: 1, overrideAccess: true });
  const [found] = existing.docs;
  const filePath = await findAssetPath(filename);

  if (found !== undefined) {
    if (filePath !== undefined) await ensureMediaBytes(instance, filename, filePath, found.mimeType ?? undefined);
    return found.id;
  }

  if (filePath === undefined) {
    instance.logger.warn(`[seed:import] asset not found, leaving media unset: ${filename}`);
    return undefined;
  }
  const created = await instance.create({ collection: 'media', data: { alt }, filePath, overrideAccess: true });
  return created.id;
};

// ---------------------------------------------------------------------------
// Slug-keyed upsert (news / works / blog).
// ---------------------------------------------------------------------------
// The data is assembled from hand-editable JSON, so the collection↔shape
// correlation Payload's typed create/update overloads demand cannot be statically
// proven for a dynamic collection name. Coerce the whole options object once at
// this write boundary (same rationale as the richText `as unknown as`).
// `slug` is the stable natural key in each record: editing a title no longer
// orphans the existing row — the upsert finds and updates by slug instead.
type CreateOptions = Parameters<Payload['create']>[0];
type UpdateOptions = Parameters<Payload['update']>[0];

const upsertBySlug = async (instance: Payload, collection: UpsertCollection, recordSlug: string, data: Record<string, unknown>): Promise<void> => {
  const existing = await instance.find({ collection, where: { slug: { equals: recordSlug } }, limit: 1, depth: 0, overrideAccess: true });
  const [found] = existing.docs;
  if (found === undefined) {
    await instance.create({ collection, data, context: writeContext, overrideAccess: true } as unknown as CreateOptions);
    return;
  }
  await instance.update({ collection, id: found.id, data, context: writeContext, overrideAccess: true } as unknown as UpdateOptions);
};

type NewsRecord = Omit<News, 'id' | 'createdAt' | 'updatedAt' | 'meta'>;
const importNews = async (instance: Payload): Promise<void> => {
  const records = await readData<NewsRecord>('news');
  for (const record of records) {
    const data = { ...record, body: asRichText(record.body) };
    await upsertBySlug(instance, 'news', record.slug, data);
  }
  instance.logger.info(`[seed:import] upserted ${records.length} news`);
};

// Resolves every upload sentinel in a body to a real media id (creating media
// rows as needed), then rewrites the body: each sentinel becomes its numeric id,
// or is dropped when the asset is missing (ensureMedia already warns). The raw
// JSON body is coerced once here (same boundary as asRichText) and a new
// (resolved) body is returned — the input tree is left untouched. Works bodies
// are optional, so an absent body (null / undefined) passes straight through.
const resolveBodyMedia = async (instance: Payload, rawBody: unknown): Promise<RichText> => {
  if (rawBody === null || rawBody === undefined) return asRichText(rawBody);
  const body = rawBody as unknown as SerializedEditorState;
  const sentinels = collectUploadSentinels(body);
  if (sentinels.length === 0) return asRichText(body);

  const resolutions = await Promise.all(
    sentinels.map(async (sentinel) => {
      const id = await ensureMedia(instance, sentinel.file, sentinel.alt);
      return { ...sentinel, id };
    }),
  );

  return asRichText(applyResolvedMedia(body, resolutions));
};

type WorkRecord = Omit<Work, 'id' | 'createdAt' | 'updatedAt' | 'meta' | 'thumbnail'> & { thumbnailFile?: string };
// Exported so the body-media resolution wiring (sentinel -> media id) can be
// exercised end-to-end against a fake Payload in import.test.ts, and reused by
// the separate works body-media repair step.
export const importWorks = async (instance: Payload): Promise<void> => {
  const records = await readData<WorkRecord>('works');
  for (const record of records) {
    const { thumbnailFile, ...rest } = record;
    const thumbnail = thumbnailFile === undefined ? undefined : await ensureMedia(instance, thumbnailFile, rest.title);
    const body = await resolveBodyMedia(instance, rest.body);
    const data = { ...rest, body, ...(thumbnail === undefined ? {} : { thumbnail }) };
    await upsertBySlug(instance, 'works', rest.slug, data);
  }
  instance.logger.info(`[seed:import] upserted ${records.length} works`);
};

type BlogRecord = Omit<Blog, 'id' | 'createdAt' | 'updatedAt' | 'meta' | 'thumbnail'> & { thumbnailFile?: string };
// Exported so the body-media resolution wiring (sentinel -> media id) can be
// exercised end-to-end against a fake Payload in import.test.ts. The thumbnail is a
// top-level `thumbnailFile` (resolved via ensureMedia, same as works), distinct from
// the body's `__file` upload sentinels.
export const importBlog = async (instance: Payload): Promise<void> => {
  const records = await readData<BlogRecord>('blog');
  for (const record of records) {
    const { thumbnailFile, ...rest } = record;
    const thumbnail = thumbnailFile === undefined ? undefined : await ensureMedia(instance, thumbnailFile, rest.title);
    const body = await resolveBodyMedia(instance, rest.body);
    const data = { ...rest, body, ...(thumbnail === undefined ? {} : { thumbnail }) };
    await upsertBySlug(instance, 'blog', rest.slug, data);
  }
  instance.logger.info(`[seed:import] upserted ${records.length} blog`);
};

type LegalDocumentRecord = Omit<LegalDocument, 'id' | 'createdAt' | 'updatedAt'>;

// body の upload sentinel → media id 解決を fake Payload で end-to-end に検証できるよう export する
// (importBlog / importWorks と同じ理由)。thumbnail は持たないので body の解決だけ。
export const importLegalDocuments = async (instance: Payload): Promise<void> => {
  const records = await readData<LegalDocumentRecord>('legal-documents');
  for (const record of records) {
    const body = await resolveBodyMedia(instance, record.body);
    const data = { ...record, body };
    await upsertBySlug(instance, 'legal-documents', record.slug, data);
  }
  instance.logger.info(`[seed:import] upserted ${records.length} legal-documents`);
};

// Logs: title is not a unique key — recurring events (e.g. a series at the same
// venue) legitimately repeat the same title across different dates, so a
// title-keyed upsert would collapse them. Mirror the gallery strategy: delete-all
// then recreate from the JSON to stay idempotent without a natural key.
type LogRecord = Omit<Log, 'id' | 'createdAt' | 'updatedAt'>;
const importLogs = async (instance: Payload): Promise<void> => {
  const records = await readData<LogRecord>('logs');
  await instance.delete({ collection: 'logs', where: { id: { exists: true } }, context: writeContext, overrideAccess: true });

  for (const record of records) {
    await instance.create({ collection: 'logs', data: { ...record }, context: writeContext, overrideAccess: true });
  }
  instance.logger.info(`[seed:import] recreated ${records.length} logs`);
};

// ---------------------------------------------------------------------------
// Gallery: no stable natural key (caption is optional and can collide), so the
// simplest idempotent strategy is delete-all then recreate from the JSON.
// ---------------------------------------------------------------------------
type GalleryRecord = { imageFile?: string; caption?: string; alt?: string; _status?: 'draft' | 'published' };
const importGallery = async (instance: Payload): Promise<void> => {
  const records = await readData<GalleryRecord>('gallery');
  await instance.delete({ collection: 'gallery', where: { id: { exists: true } }, context: writeContext, overrideAccess: true });

  for (const record of records) {
    const { imageFile, ...rest } = record;
    const altText = rest.alt ?? rest.caption ?? imageFile ?? 'gallery image';
    const image = imageFile === undefined ? undefined : await ensureMedia(instance, imageFile, altText);
    if (image === undefined) {
      instance.logger.warn(`[seed:import] gallery image required but unresolved, skipping row: ${imageFile ?? '(no imageFile)'}`);
      continue;
    }
    await instance.create({ collection: 'gallery', data: { ...rest, image }, context: writeContext, overrideAccess: true });
  }
  instance.logger.info(`[seed:import] recreated ${records.length} gallery rows`);
};

// ---------------------------------------------------------------------------
// Profile global.
// ---------------------------------------------------------------------------
const importProfile = async (instance: Payload): Promise<void> => {
  const raw = await readFile(path.resolve(dataDir, 'profile.json'), 'utf8');
  const parsed: unknown = JSON.parse(raw);
  if (!isPlainObject(parsed)) throw new Error('[seed:import] profile.json is not a JSON object');
  const data = { ...parsed, bio: asRichText(parsed.bio), philosophy: asRichText(parsed.philosophy) };
  await instance.updateGlobal({ slug: 'profile', data, context: writeContext, overrideAccess: true });
  instance.logger.info('[seed:import] updated profile global');
};

// Content-only import: upsert every collection + the profile global from
// src/seed/data/*.json. Deliberately touches no `users` row, so it is safe to
// run against production (`seed:import:prod`), where the admin user is created
// via Payload's create-first-user onboarding instead.
export const importContent = async (instance: Payload): Promise<void> => {
  await importNews(instance);
  await importWorks(instance);
  await importBlog(instance);
  await importLegalDocuments(instance);
  await importLogs(instance);
  await importGallery(instance);
  await importProfile(instance);
};

// Dev seed routine: ensure the dev admin user, then import all content.
// Reusable from other bin scripts (e.g. `pnpm payload seed`) without
// re-initializing Payload. Dev-only — never run against production.
export const importSeedData = async (instance: Payload): Promise<void> => {
  await ensureAdminUser(instance);
  await importContent(instance);
};

// Payload bin script entry point. Invoked by `pnpm seed:import`.
export const script = async (config: SanitizedConfig): Promise<void> => {
  await payload.init({ config });
  await importSeedData(payload);
  process.exit(0);
};
