import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`software\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`slug\` text,
  	\`name\` text,
  	\`summary\` text,
  	\`terms\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`_status\` text DEFAULT 'draft'
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`software_slug_idx\` ON \`software\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`software_updated_at_idx\` ON \`software\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`software_created_at_idx\` ON \`software\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`software__status_idx\` ON \`software\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`_software_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_slug\` text,
  	\`version_name\` text,
  	\`version_summary\` text,
  	\`version_terms\` text,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	\`autosave\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`software\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_software_v_parent_idx\` ON \`_software_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_software_v_version_version_slug_idx\` ON \`_software_v\` (\`version_slug\`);`)
  await db.run(sql`CREATE INDEX \`_software_v_version_version_updated_at_idx\` ON \`_software_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_software_v_version_version_created_at_idx\` ON \`_software_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX \`_software_v_version_version__status_idx\` ON \`_software_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_software_v_created_at_idx\` ON \`_software_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_software_v_updated_at_idx\` ON \`_software_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_software_v_latest_idx\` ON \`_software_v\` (\`latest\`);`)
  await db.run(sql`CREATE INDEX \`_software_v_autosave_idx\` ON \`_software_v\` (\`autosave\`);`)
  await db.run(sql`CREATE TABLE \`software_release\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`software_id\` integer NOT NULL,
  	\`version\` text NOT NULL,
  	\`released_at\` text NOT NULL,
  	\`changelog\` text,
  	\`prefix\` text DEFAULT 'releases',
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`url\` text,
  	\`thumbnail_u_r_l\` text,
  	\`filename\` text,
  	\`mime_type\` text,
  	\`filesize\` numeric,
  	\`width\` numeric,
  	\`height\` numeric,
  	\`focal_x\` numeric,
  	\`focal_y\` numeric,
  	FOREIGN KEY (\`software_id\`) REFERENCES \`software\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`software_release_software_idx\` ON \`software_release\` (\`software_id\`);`)
  await db.run(sql`CREATE INDEX \`software_release_updated_at_idx\` ON \`software_release\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`software_release_created_at_idx\` ON \`software_release\` (\`created_at\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`software_release_filename_idx\` ON \`software_release\` (\`filename\`);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`software_id\` integer REFERENCES software(id);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`software_release_id\` integer REFERENCES software_release(id);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_software_id_idx\` ON \`payload_locked_documents_rels\` (\`software_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_software_release_id_idx\` ON \`payload_locked_documents_rels\` (\`software_release_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`software\`;`)
  await db.run(sql`DROP TABLE \`_software_v\`;`)
  await db.run(sql`DROP TABLE \`software_release\`;`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`users_id\` integer,
  	\`media_id\` integer,
  	\`news_id\` integer,
  	\`works_id\` integer,
  	\`blog_id\` integer,
  	\`gallery_id\` integer,
  	\`logs_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`news_id\`) REFERENCES \`news\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`works_id\`) REFERENCES \`works\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`blog_id\`) REFERENCES \`blog\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`gallery_id\`) REFERENCES \`gallery\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`logs_id\`) REFERENCES \`logs\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "users_id", "media_id", "news_id", "works_id", "blog_id", "gallery_id", "logs_id") SELECT "id", "order", "parent_id", "path", "users_id", "media_id", "news_id", "works_id", "blog_id", "gallery_id", "logs_id" FROM \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_payload_locked_documents_rels\` RENAME TO \`payload_locked_documents_rels\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_news_id_idx\` ON \`payload_locked_documents_rels\` (\`news_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_works_id_idx\` ON \`payload_locked_documents_rels\` (\`works_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_blog_id_idx\` ON \`payload_locked_documents_rels\` (\`blog_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_gallery_id_idx\` ON \`payload_locked_documents_rels\` (\`gallery_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_logs_id_idx\` ON \`payload_locked_documents_rels\` (\`logs_id\`);`)
}
