import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`news\` ADD \`pinned\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`_news_v\` ADD \`version_pinned\` integer DEFAULT false;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`news\` DROP COLUMN \`pinned\`;`)
  await db.run(sql`ALTER TABLE \`_news_v\` DROP COLUMN \`version_pinned\`;`)
}
