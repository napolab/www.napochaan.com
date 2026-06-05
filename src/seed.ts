import payload from 'payload';

import type { Payload, SanitizedConfig } from 'payload';

const ADMIN_EMAIL = process.env.PAYLOAD_SEED_EMAIL ?? 'dev@napochaan.com';
const ADMIN_PASSWORD = process.env.PAYLOAD_SEED_PASSWORD ?? 'password';

const lexicalParagraph = (text: string) => ({
  root: {
    type: 'root',
    children: [
      {
        type: 'paragraph',
        children: [{ type: 'text', text, format: 0, detail: 0, mode: 'normal', style: '', version: 1 }],
        direction: 'ltr' as const,
        format: '' as const,
        indent: 0,
        textFormat: 0,
        version: 1,
      },
    ],
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    version: 1,
  },
});

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

// Idempotent: only create the sample page if its slug is not taken.
const ensureSamplePage = async (instance: Payload): Promise<void> => {
  const existing = await instance.find({
    collection: 'pages',
    where: { slug: { equals: 'home' } },
    limit: 1,
  });

  if (existing.docs.length > 0) {
    instance.logger.info('[seed] sample page already exists: /home');
    return;
  }

  await instance.create({
    collection: 'pages',
    data: {
      title: 'ようこそ',
      slug: 'home',
      excerpt: 'napochaan の個人サイトへようこそ。',
      content: lexicalParagraph('これは Payload CMS のシードで作成されたサンプルページです。'),
    },
  });
  instance.logger.info('[seed] created sample page: /home');
};

// Payload bin script entry point. Invoked by `pnpm payload:seed`.
// Per Payload's custom bin spec the function MUST be a named `script` export.
export const script = async (config: SanitizedConfig): Promise<void> => {
  await payload.init({ config });
  await ensureAdminUser(payload);
  await ensureSamplePage(payload);
  process.exit(0);
};
