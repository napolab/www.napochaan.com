import payload from 'payload';

import { richTextFromParagraphs } from '@utils/sample-rich-text';

import { newsSeed } from './seed/news-data';

import type { News } from '@payload-types';
import type { Payload, SanitizedConfig } from 'payload';

const ADMIN_EMAIL = process.env.PAYLOAD_SEED_EMAIL ?? 'dev@napochaan.com';
const ADMIN_PASSWORD = process.env.PAYLOAD_SEED_PASSWORD ?? 'password';

// Idempotent: only create the admin user if it does not already exist.
const ensureAdminUser = async (instance: Payload): Promise<void> => {
  const existing = await instance.find({
    collection: 'users',
    where: { email: { equals: ADMIN_EMAIL } },
    limit: 1,
  });

  if (existing.docs.length > 0) {
    instance.logger.info(`[seed] admin user already exists: ${ADMIN_EMAIL}`);
    return;
  }

  const created = await instance.create({
    collection: 'users',
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD, name: 'napochaan admin' },
  });
  instance.logger.info(`[seed] created admin user: ${ADMIN_EMAIL} (id=${created.id})`);
};

// Upsert per item, keyed by title: update an existing row in place (so remapped
// categories self-correct) or create a missing one. `disableRevalidate` no-ops
// the collection's revalidate hook — there is no Next request context during seed.
const ensureNews = async (instance: Payload): Promise<void> => {
  for (const item of newsSeed) {
    // `richTextFromParagraphs` returns a lexical SerializedEditorState; Payload's
    // generated News.body uses a structurally-equivalent shape with an index
    // signature, so coerce once at this write boundary.
    const body = richTextFromParagraphs(item.paragraphs) as unknown as News['body'];
    const data = {
      title: item.title,
      publishedAt: item.publishedAt,
      category: item.category,
      url: item.url,
      body,
      _status: 'published' as const,
    };

    const existing = await instance.find({
      collection: 'news',
      where: { title: { equals: item.title } },
      limit: 1,
      depth: 0,
    });
    const [found] = existing.docs;

    if (found === undefined) {
      await instance.create({ collection: 'news', data, context: { disableRevalidate: true } });
      continue;
    }

    await instance.update({ collection: 'news', id: found.id, data, context: { disableRevalidate: true } });
  }
  instance.logger.info(`[seed] upserted ${newsSeed.length} news entries`);
};

// Payload bin script entry point. Invoked by `pnpm payload:seed`.
// Per Payload's custom bin spec the function MUST be a named `script` export.
export const script = async (config: SanitizedConfig): Promise<void> => {
  await payload.init({ config });
  await ensureAdminUser(payload);
  await ensureNews(payload);
  process.exit(0);
};
