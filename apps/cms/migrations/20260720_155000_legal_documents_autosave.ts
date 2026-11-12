import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`_legal_documents_v\` ADD \`autosave\` integer;`)
  await db.run(sql`CREATE INDEX \`_legal_documents_v_autosave_idx\` ON \`_legal_documents_v\` (\`autosave\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP INDEX \`_legal_documents_v_autosave_idx\`;`)
  await db.run(sql`ALTER TABLE \`_legal_documents_v\` DROP COLUMN \`autosave\`;`)
}
