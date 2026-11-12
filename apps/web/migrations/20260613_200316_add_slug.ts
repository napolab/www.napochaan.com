import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

// Schema-only: add a nullable `slug` to the main tables (+ unique index) and
// `version_slug` to the version tables. Nullable so the ALTER succeeds on
// existing rows; the `required` constraint is enforced by Payload field
// validation, not the DB. Data is populated by the seed import (slug-matched
// upsert), not in-migration — staging is dropped + re-seeded, and a fresh local
// DB is seeded from the slug-carrying JSON. (Production's one-time slug
// bootstrap is intentionally out of scope here — see the slug-urls runbook.)

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`works\` ADD \`slug\` text;`)
  await db.run(sql`CREATE UNIQUE INDEX \`works_slug_idx\` ON \`works\` (\`slug\`);`)
  await db.run(sql`ALTER TABLE \`_works_v\` ADD \`version_slug\` text;`)

  await db.run(sql`ALTER TABLE \`news\` ADD \`slug\` text;`)
  await db.run(sql`CREATE UNIQUE INDEX \`news_slug_idx\` ON \`news\` (\`slug\`);`)
  await db.run(sql`ALTER TABLE \`_news_v\` ADD \`version_slug\` text;`)

  await db.run(sql`ALTER TABLE \`blog\` ADD \`slug\` text;`)
  await db.run(sql`CREATE UNIQUE INDEX \`blog_slug_idx\` ON \`blog\` (\`slug\`);`)
  await db.run(sql`ALTER TABLE \`_blog_v\` ADD \`version_slug\` text;`)
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
