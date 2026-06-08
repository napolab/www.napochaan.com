import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`works\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`no\` text,
  	\`type\` text,
  	\`year\` numeric,
  	\`url\` text,
  	\`thumbnail_id\` integer,
  	\`description\` text,
  	\`body\` text,
  	\`meta_title\` text,
  	\`meta_description\` text,
  	\`meta_image_id\` integer,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`_status\` text DEFAULT 'draft',
  	FOREIGN KEY (\`thumbnail_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`meta_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`works_thumbnail_idx\` ON \`works\` (\`thumbnail_id\`);`)
  await db.run(sql`CREATE INDEX \`works_meta_meta_image_idx\` ON \`works\` (\`meta_image_id\`);`)
  await db.run(sql`CREATE INDEX \`works_updated_at_idx\` ON \`works\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`works_created_at_idx\` ON \`works\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`works__status_idx\` ON \`works\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`_works_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_title\` text,
  	\`version_no\` text,
  	\`version_type\` text,
  	\`version_year\` numeric,
  	\`version_url\` text,
  	\`version_thumbnail_id\` integer,
  	\`version_description\` text,
  	\`version_body\` text,
  	\`version_meta_title\` text,
  	\`version_meta_description\` text,
  	\`version_meta_image_id\` integer,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	\`autosave\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`works\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_thumbnail_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_meta_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_works_v_parent_idx\` ON \`_works_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_works_v_version_version_thumbnail_idx\` ON \`_works_v\` (\`version_thumbnail_id\`);`)
  await db.run(sql`CREATE INDEX \`_works_v_version_meta_version_meta_image_idx\` ON \`_works_v\` (\`version_meta_image_id\`);`)
  await db.run(sql`CREATE INDEX \`_works_v_version_version_updated_at_idx\` ON \`_works_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_works_v_version_version_created_at_idx\` ON \`_works_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX \`_works_v_version_version__status_idx\` ON \`_works_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_works_v_created_at_idx\` ON \`_works_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_works_v_updated_at_idx\` ON \`_works_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_works_v_latest_idx\` ON \`_works_v\` (\`latest\`);`)
  await db.run(sql`CREATE INDEX \`_works_v_autosave_idx\` ON \`_works_v\` (\`autosave\`);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`works_id\` integer REFERENCES works(id);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_works_id_idx\` ON \`payload_locked_documents_rels\` (\`works_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`works\`;`)
  await db.run(sql`DROP TABLE \`_works_v\`;`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`users_id\` integer,
  	\`media_id\` integer,
  	\`news_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`news_id\`) REFERENCES \`news\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "users_id", "media_id", "news_id") SELECT "id", "order", "parent_id", "path", "users_id", "media_id", "news_id" FROM \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_payload_locked_documents_rels\` RENAME TO \`payload_locked_documents_rels\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_news_id_idx\` ON \`payload_locked_documents_rels\` (\`news_id\`);`)
}
