import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`blog\` DROP COLUMN \`source\`;`)
  await db.run(sql`ALTER TABLE \`_blog_v\` DROP COLUMN \`version_source\`;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`blog\` ADD \`source\` text;`)
  await db.run(sql`ALTER TABLE \`_blog_v\` ADD \`version_source\` text;`)
}
