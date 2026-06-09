import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import payload from 'payload';

import type { Blog, Log, News, Work } from '@payload-types';
import type { Payload, SanitizedConfig } from 'payload';

type TitleSlug = 'news' | 'works' | 'blog' | 'logs';

// Reads src/seed/data/*.json (produced by `seed:export`, or hand-edited) and
// upserts every collection + the profile global. Idempotent: re-running must not
// duplicate rows. `disableRevalidate` no-ops the collection revalidate hooks —
// there is no Next request context during a bin script.

const dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(dirname, 'data');
const assetsDir = path.resolve(dirname, '..', 'assets');

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
// Admin user (idempotent — duplicated from src/seed.ts to keep the bin scripts
// self-contained).
// ---------------------------------------------------------------------------
const ensureAdminUser = async (instance: Payload): Promise<void> => {
  const existing = await instance.find({ collection: 'users', where: { email: { equals: ADMIN_EMAIL } }, limit: 1 });
  if (existing.docs.length > 0) {
    instance.logger.info(`[seed:import] admin user already exists: ${ADMIN_EMAIL}`);
    return;
  }
  const created = await instance.create({ collection: 'users', data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD, name: 'napochaan admin' } });
  instance.logger.info(`[seed:import] created admin user: ${ADMIN_EMAIL} (id=${created.id})`);
};

// ---------------------------------------------------------------------------
// Media resolution: find a file by name anywhere under src/assets, then
// find-or-create its media row. Returns the media id, or undefined if the file
// is missing (caller leaves the relationship unset rather than crashing).
// ---------------------------------------------------------------------------
const findAssetPath = async (filename: string): Promise<string | undefined> => {
  const entries = await readdir(assetsDir, { recursive: true, withFileTypes: true });
  const match = entries.find((entry) => entry.isFile() && entry.name === filename);
  if (match === undefined) return undefined;
  return path.resolve(match.parentPath, match.name);
};

const ensureMedia = async (instance: Payload, filename: string, alt: string): Promise<number | undefined> => {
  const existing = await instance.find({ collection: 'media', where: { filename: { equals: filename } }, limit: 1, overrideAccess: true });
  const [found] = existing.docs;
  if (found !== undefined) return found.id;

  const filePath = await findAssetPath(filename);
  if (filePath === undefined) {
    instance.logger.warn(`[seed:import] asset not found, leaving media unset: ${filename}`);
    return undefined;
  }
  const created = await instance.create({ collection: 'media', data: { alt }, filePath, overrideAccess: true });
  return created.id;
};

// ---------------------------------------------------------------------------
// Title-keyed upsert (news / works / blog / logs).
// ---------------------------------------------------------------------------
// The data is assembled from hand-editable JSON, so the slug↔shape correlation
// Payload's typed create/update overloads demand cannot be statically proven for a
// dynamic slug. Coerce the whole options object once at this write boundary (same
// rationale as the richText `as unknown as`).
type CreateOptions = Parameters<Payload['create']>[0];
type UpdateOptions = Parameters<Payload['update']>[0];

const upsertByTitle = async (instance: Payload, slug: TitleSlug, title: string, data: Record<string, unknown>): Promise<void> => {
  const existing = await instance.find({ collection: slug, where: { title: { equals: title } }, limit: 1, depth: 0, overrideAccess: true });
  const [found] = existing.docs;
  if (found === undefined) {
    await instance.create({ collection: slug, data, context: writeContext, overrideAccess: true } as unknown as CreateOptions);
    return;
  }
  await instance.update({ collection: slug, id: found.id, data, context: writeContext, overrideAccess: true } as unknown as UpdateOptions);
};

type NewsRecord = Omit<News, 'id' | 'createdAt' | 'updatedAt' | 'meta'>;
const importNews = async (instance: Payload): Promise<void> => {
  const records = await readData<NewsRecord>('news');
  for (const record of records) {
    const data = { ...record, body: asRichText(record.body) };
    await upsertByTitle(instance, 'news', record.title, data);
  }
  instance.logger.info(`[seed:import] upserted ${records.length} news`);
};

type WorkRecord = Omit<Work, 'id' | 'createdAt' | 'updatedAt' | 'meta' | 'thumbnail'> & { thumbnailFile?: string };
const importWorks = async (instance: Payload): Promise<void> => {
  const records = await readData<WorkRecord>('works');
  for (const record of records) {
    const { thumbnailFile, ...rest } = record;
    const thumbnail = thumbnailFile === undefined ? undefined : await ensureMedia(instance, thumbnailFile, rest.title);
    const data = { ...rest, body: asRichText(rest.body), ...(thumbnail === undefined ? {} : { thumbnail }) };
    await upsertByTitle(instance, 'works', rest.title, data);
  }
  instance.logger.info(`[seed:import] upserted ${records.length} works`);
};

type BlogRecord = Omit<Blog, 'id' | 'createdAt' | 'updatedAt' | 'meta'>;
const importBlog = async (instance: Payload): Promise<void> => {
  const records = await readData<BlogRecord>('blog');
  for (const record of records) {
    const data = { ...record, body: asRichText(record.body) };
    await upsertByTitle(instance, 'blog', record.title, data);
  }
  instance.logger.info(`[seed:import] upserted ${records.length} blog`);
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
type GalleryRecord = { imageFile?: string; caption?: string; alt?: string; order?: number; _status?: 'draft' | 'published' };
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

// Core import routine: ensure the admin user, then upsert every collection +
// the profile global from src/seed/data/*.json. Reusable from other bin scripts
// (e.g. `pnpm payload seed`) without re-initializing Payload.
export const importSeedData = async (instance: Payload): Promise<void> => {
  await ensureAdminUser(instance);
  await importNews(instance);
  await importWorks(instance);
  await importBlog(instance);
  await importLogs(instance);
  await importGallery(instance);
  await importProfile(instance);
};

// Payload bin script entry point. Invoked by `pnpm seed:import`.
export const script = async (config: SanitizedConfig): Promise<void> => {
  await payload.init({ config });
  await importSeedData(payload);
  process.exit(0);
};
