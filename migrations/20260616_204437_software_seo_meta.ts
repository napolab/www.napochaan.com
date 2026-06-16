import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`software\` ADD \`meta_title\` text;`)
  await db.run(sql`ALTER TABLE \`software\` ADD \`meta_description\` text;`)
  await db.run(sql`ALTER TABLE \`software\` ADD \`meta_image_id\` integer REFERENCES media(id);`)
  await db.run(sql`CREATE INDEX \`software_meta_meta_image_idx\` ON \`software\` (\`meta_image_id\`);`)
  await db.run(sql`ALTER TABLE \`_software_v\` ADD \`version_meta_title\` text;`)
  await db.run(sql`ALTER TABLE \`_software_v\` ADD \`version_meta_description\` text;`)
  await db.run(sql`ALTER TABLE \`_software_v\` ADD \`version_meta_image_id\` integer REFERENCES media(id);`)
  await db.run(sql`CREATE INDEX \`_software_v_version_meta_version_meta_image_idx\` ON \`_software_v\` (\`version_meta_image_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_software\` (
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
  await db.run(sql`INSERT INTO \`__new_software\`("id", "slug", "name", "summary", "terms", "updated_at", "created_at", "_status") SELECT "id", "slug", "name", "summary", "terms", "updated_at", "created_at", "_status" FROM \`software\`;`)
  await db.run(sql`DROP TABLE \`software\`;`)
  await db.run(sql`ALTER TABLE \`__new_software\` RENAME TO \`software\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE UNIQUE INDEX \`software_slug_idx\` ON \`software\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`software_updated_at_idx\` ON \`software\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`software_created_at_idx\` ON \`software\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`software__status_idx\` ON \`software\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`__new__software_v\` (
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
  await db.run(sql`INSERT INTO \`__new__software_v\`("id", "parent_id", "version_slug", "version_name", "version_summary", "version_terms", "version_updated_at", "version_created_at", "version__status", "created_at", "updated_at", "latest", "autosave") SELECT "id", "parent_id", "version_slug", "version_name", "version_summary", "version_terms", "version_updated_at", "version_created_at", "version__status", "created_at", "updated_at", "latest", "autosave" FROM \`_software_v\`;`)
  await db.run(sql`DROP TABLE \`_software_v\`;`)
  await db.run(sql`ALTER TABLE \`__new__software_v\` RENAME TO \`_software_v\`;`)
  await db.run(sql`CREATE INDEX \`_software_v_parent_idx\` ON \`_software_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_software_v_version_version_slug_idx\` ON \`_software_v\` (\`version_slug\`);`)
  await db.run(sql`CREATE INDEX \`_software_v_version_version_updated_at_idx\` ON \`_software_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_software_v_version_version_created_at_idx\` ON \`_software_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX \`_software_v_version_version__status_idx\` ON \`_software_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_software_v_created_at_idx\` ON \`_software_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_software_v_updated_at_idx\` ON \`_software_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_software_v_latest_idx\` ON \`_software_v\` (\`latest\`);`)
  await db.run(sql`CREATE INDEX \`_software_v_autosave_idx\` ON \`_software_v\` (\`autosave\`);`)
}
