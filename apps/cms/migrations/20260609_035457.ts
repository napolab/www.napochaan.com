import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`gallery\` ADD \`_order\` text;`)
  await db.run(sql`CREATE INDEX \`gallery__order_idx\` ON \`gallery\` (\`_order\`);`)
  await db.run(sql`ALTER TABLE \`gallery\` DROP COLUMN \`order\`;`)
  await db.run(sql`ALTER TABLE \`_gallery_v\` ADD \`version__order\` text;`)
  await db.run(sql`CREATE INDEX \`_gallery_v_version_version__order_idx\` ON \`_gallery_v\` (\`version__order\`);`)
  await db.run(sql`ALTER TABLE \`_gallery_v\` DROP COLUMN \`version_order\`;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP INDEX \`gallery__order_idx\`;`)
  await db.run(sql`ALTER TABLE \`gallery\` ADD \`order\` numeric;`)
  await db.run(sql`ALTER TABLE \`gallery\` DROP COLUMN \`_order\`;`)
  await db.run(sql`DROP INDEX \`_gallery_v_version_version__order_idx\`;`)
  await db.run(sql`ALTER TABLE \`_gallery_v\` ADD \`version_order\` numeric;`)
  await db.run(sql`ALTER TABLE \`_gallery_v\` DROP COLUMN \`version__order\`;`)
}
