import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import payload from 'payload';

import type { Gallery, Media, Work } from '@payload-types';
import type { Payload, SanitizedConfig } from 'payload';

// Decouples seed data from migrations: dumps the live CMS content to editable
// JSON under src/seed/data/. The companion `seed:import` script upserts it back.
// System columns (id / timestamps / SEO meta / upload sizes) are stripped so the
// files stay hand-editable; media relationships collapse to a filename string.

const dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(dirname, 'data');

// Keys Payload manages for us — never hand-edited, regenerated on import.
// `globalType` is injected by findGlobal and rejected by updateGlobal on the way back.
const SYSTEM_KEYS = ['id', 'createdAt', 'updatedAt', 'meta', 'sizes', 'globalType'] as const;

const isPlainObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

// Recursively drop the generated `id` Payload injects into array-field rows
// (profile.love[].id, skillGroups[].id, contacts[].id ...). richText bodies keep
// their lexical shape untouched — they live under keys we never recurse-strip.
const stripArrayRowIds = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map((item) => stripArrayRowIds(item));
  if (!isPlainObject(value)) return value;

  return Object.fromEntries(Object.entries(value).flatMap(([key, val]) => (key === 'id' ? [] : [[key, stripArrayRowIds(val)]])));
};

const stripSystemKeys = (doc: object): Record<string, unknown> => Object.fromEntries(Object.entries(doc).filter(([key]) => !SYSTEM_KEYS.includes(key as (typeof SYSTEM_KEYS)[number])));

// A populated upload relationship (depth: 1) is the Media object; pull its
// filename so the import side can re-resolve the file from src/assets.
const mediaFilename = (value: number | Media | null | undefined): string | undefined => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'number') return undefined;
  return value.filename ?? undefined;
};

const toWorkRecord = (work: Work): Record<string, unknown> => {
  const { thumbnail, ...rest } = work;
  const thumbnailFile = mediaFilename(thumbnail);
  const base = stripSystemKeys(rest);
  if (thumbnailFile === undefined) return base;
  return { ...base, thumbnailFile };
};

const toGalleryRecord = (item: Gallery): Record<string, unknown> => {
  const { image, ...rest } = item;
  const imageFile = mediaFilename(image);
  const base = stripSystemKeys(rest);
  if (imageFile === undefined) return base;
  return { ...base, imageFile };
};

const writeJson = async (instance: Payload, slug: string, records: readonly unknown[]): Promise<void> => {
  const filePath = path.resolve(dataDir, `${slug}.json`);
  await writeFile(filePath, `${JSON.stringify(records, null, 2)}\n`, 'utf8');
  instance.logger.info(`[seed:export] wrote ${records.length} ${slug} → ${path.relative(process.cwd(), filePath)}`);
};

const exportWorks = async (instance: Payload): Promise<void> => {
  const { docs } = await instance.find({ collection: 'works', depth: 1, limit: 0, sort: 'date', overrideAccess: true });
  await writeJson(instance, 'works', docs.map(toWorkRecord));
};

const exportGallery = async (instance: Payload): Promise<void> => {
  const { docs } = await instance.find({ collection: 'gallery', depth: 1, limit: 0, sort: 'order', overrideAccess: true });
  await writeJson(instance, 'gallery', docs.map(toGalleryRecord));
};

// News / blog / logs carry no media relationship — strip system keys only.
const exportSimple = async (instance: Payload, slug: 'news' | 'blog' | 'logs', sort: string): Promise<void> => {
  const { docs } = await instance.find({ collection: slug, depth: 1, limit: 0, sort, overrideAccess: true });
  await writeJson(instance, slug, docs.map(stripSystemKeys));
};

const exportProfile = async (instance: Payload): Promise<void> => {
  const profile = await instance.findGlobal({ slug: 'profile', depth: 1, overrideAccess: true });
  const record = stripArrayRowIds(stripSystemKeys(profile));
  const filePath = path.resolve(dataDir, 'profile.json');
  await writeFile(filePath, `${JSON.stringify(record, null, 2)}\n`, 'utf8');
  instance.logger.info(`[seed:export] wrote profile → ${path.relative(process.cwd(), filePath)}`);
};

// Payload bin script entry point. Invoked by `pnpm seed:export`.
export const script = async (config: SanitizedConfig): Promise<void> => {
  await payload.init({ config });
  await mkdir(dataDir, { recursive: true });
  await exportWorks(payload);
  await exportSimple(payload, 'news', 'publishedAt');
  await exportSimple(payload, 'blog', 'publishedAt');
  await exportSimple(payload, 'logs', 'date');
  await exportGallery(payload);
  await exportProfile(payload);
  process.exit(0);
};
