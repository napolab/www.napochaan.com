import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

import blogSeed from '../src/seed/data/blog.json'
import newsSeed from '../src/seed/data/news.json'
import worksSeed from '../src/seed/data/works.json'

export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  // Schema: nullable slug on the main tables (+ unique index) and version_slug on
  // the version tables. Nullable so the ALTER succeeds on existing rows; the
  // `required` constraint is enforced by Payload field validation, not the DB.
  await db.run(sql`ALTER TABLE \`works\` ADD \`slug\` text;`)
  await db.run(sql`CREATE UNIQUE INDEX \`works_slug_idx\` ON \`works\` (\`slug\`);`)
  await db.run(sql`ALTER TABLE \`_works_v\` ADD \`version_slug\` text;`)

  await db.run(sql`ALTER TABLE \`news\` ADD \`slug\` text;`)
  await db.run(sql`CREATE UNIQUE INDEX \`news_slug_idx\` ON \`news\` (\`slug\`);`)
  await db.run(sql`ALTER TABLE \`_news_v\` ADD \`version_slug\` text;`)

  await db.run(sql`ALTER TABLE \`blog\` ADD \`slug\` text;`)
  await db.run(sql`CREATE UNIQUE INDEX \`blog_slug_idx\` ON \`blog\` (\`slug\`);`)
  await db.run(sql`ALTER TABLE \`_blog_v\` ADD \`version_slug\` text;`)

  // Backfill existing rows by exact title match. payload.update writes both the
  // main table and the latest version row (required for drafts-enabled
  // collections). A title with no live row updates zero docs and is a no-op.
  for (const entry of worksSeed) {
    await payload.update({ collection: 'works', where: { title: { equals: entry.title } }, data: { slug: entry.slug }, overrideAccess: true })
  }
  for (const entry of newsSeed) {
    await payload.update({ collection: 'news', where: { title: { equals: entry.title } }, data: { slug: entry.slug }, overrideAccess: true })
  }
  for (const entry of blogSeed) {
    await payload.update({ collection: 'blog', where: { title: { equals: entry.title } }, data: { slug: entry.slug }, overrideAccess: true })
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP INDEX IF EXISTS \`works_slug_idx\`;`)
  await db.run(sql`ALTER TABLE \`works\` DROP COLUMN \`slug\`;`)
  await db.run(sql`ALTER TABLE \`_works_v\` DROP COLUMN \`version_slug\`;`)
  await db.run(sql`DROP INDEX IF EXISTS \`news_slug_idx\`;`)
  await db.run(sql`ALTER TABLE \`news\` DROP COLUMN \`slug\`;`)
  await db.run(sql`ALTER TABLE \`_news_v\` DROP COLUMN \`version_slug\`;`)
  await db.run(sql`DROP INDEX IF EXISTS \`blog_slug_idx\`;`)
  await db.run(sql`ALTER TABLE \`blog\` DROP COLUMN \`slug\`;`)
  await db.run(sql`ALTER TABLE \`_blog_v\` DROP COLUMN \`version_slug\`;`)
}
