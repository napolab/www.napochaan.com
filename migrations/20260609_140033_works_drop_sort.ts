import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`works\` DROP COLUMN \`sort\`;`)
  await db.run(sql`ALTER TABLE \`_works_v\` DROP COLUMN \`version_sort\`;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`works\` ADD \`sort\` numeric;`)
  await db.run(sql`ALTER TABLE \`_works_v\` ADD \`version_sort\` numeric;`)
}
