import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`legal_documents\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`slug\` text,
  	\`title\` text,
  	\`effective_at\` text,
  	\`body\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`_status\` text DEFAULT 'draft'
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`legal_documents_slug_idx\` ON \`legal_documents\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`legal_documents_updated_at_idx\` ON \`legal_documents\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`legal_documents_created_at_idx\` ON \`legal_documents\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`legal_documents__status_idx\` ON \`legal_documents\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`_legal_documents_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_slug\` text,
  	\`version_title\` text,
  	\`version_effective_at\` text,
  	\`version_body\` text,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`legal_documents\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_legal_documents_v_parent_idx\` ON \`_legal_documents_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_legal_documents_v_version_version_slug_idx\` ON \`_legal_documents_v\` (\`version_slug\`);`)
  await db.run(sql`CREATE INDEX \`_legal_documents_v_version_version_updated_at_idx\` ON \`_legal_documents_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_legal_documents_v_version_version_created_at_idx\` ON \`_legal_documents_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX \`_legal_documents_v_version_version__status_idx\` ON \`_legal_documents_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_legal_documents_v_created_at_idx\` ON \`_legal_documents_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_legal_documents_v_updated_at_idx\` ON \`_legal_documents_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_legal_documents_v_latest_idx\` ON \`_legal_documents_v\` (\`latest\`);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`legal_documents_id\` integer REFERENCES legal_documents(id);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_legal_documents_id_idx\` ON \`payload_locked_documents_rels\` (\`legal_documents_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`legal_documents\`;`)
  await db.run(sql`DROP TABLE \`_legal_documents_v\`;`)
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
