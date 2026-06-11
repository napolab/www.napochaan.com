import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`DROP INDEX \`news__order_idx\`;`)
  await db.run(sql`ALTER TABLE \`news\` DROP COLUMN \`_order\`;`)
  await db.run(sql`DROP INDEX \`_news_v_version_version__order_idx\`;`)
  await db.run(sql`ALTER TABLE \`_news_v\` DROP COLUMN \`version__order\`;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`news\` ADD \`_order\` text;`)
  await db.run(sql`CREATE INDEX \`news__order_idx\` ON \`news\` (\`_order\`);`)
  await db.run(sql`ALTER TABLE \`_news_v\` ADD \`version__order\` text;`)
  await db.run(sql`CREATE INDEX \`_news_v_version_version__order_idx\` ON \`_news_v\` (\`version__order\`);`)
}
