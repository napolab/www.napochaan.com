import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`profile_love\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`value\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`profile\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`profile_love_order_idx\` ON \`profile_love\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`profile_love_parent_id_idx\` ON \`profile_love\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`profile_skill_groups_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`value\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`profile_skill_groups\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`profile_skill_groups_items_order_idx\` ON \`profile_skill_groups_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`profile_skill_groups_items_parent_id_idx\` ON \`profile_skill_groups_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`profile_skill_groups\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`category\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`profile\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`profile_skill_groups_order_idx\` ON \`profile_skill_groups\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`profile_skill_groups_parent_id_idx\` ON \`profile_skill_groups\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`profile_contacts\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`handle\` text,
  	\`href\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`profile\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`profile_contacts_order_idx\` ON \`profile_contacts\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`profile_contacts_parent_id_idx\` ON \`profile_contacts\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`profile\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text,
  	\`aka\` text,
  	\`now\` text,
  	\`team\` text,
  	\`tagline\` text,
  	\`bio\` text,
  	\`philosophy\` text,
  	\`_status\` text DEFAULT 'draft',
  	\`updated_at\` text,
  	\`created_at\` text
  );
  `)
  await db.run(sql`CREATE INDEX \`profile__status_idx\` ON \`profile\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`_profile_v_version_love\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`value\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_profile_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_profile_v_version_love_order_idx\` ON \`_profile_v_version_love\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_profile_v_version_love_parent_id_idx\` ON \`_profile_v_version_love\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_profile_v_version_skill_groups_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`value\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_profile_v_version_skill_groups\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_profile_v_version_skill_groups_items_order_idx\` ON \`_profile_v_version_skill_groups_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_profile_v_version_skill_groups_items_parent_id_idx\` ON \`_profile_v_version_skill_groups_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_profile_v_version_skill_groups\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`category\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_profile_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_profile_v_version_skill_groups_order_idx\` ON \`_profile_v_version_skill_groups\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_profile_v_version_skill_groups_parent_id_idx\` ON \`_profile_v_version_skill_groups\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_profile_v_version_contacts\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`handle\` text,
  	\`href\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_profile_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_profile_v_version_contacts_order_idx\` ON \`_profile_v_version_contacts\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_profile_v_version_contacts_parent_id_idx\` ON \`_profile_v_version_contacts\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_profile_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`version_name\` text,
  	\`version_aka\` text,
  	\`version_now\` text,
  	\`version_team\` text,
  	\`version_tagline\` text,
  	\`version_bio\` text,
  	\`version_philosophy\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	\`autosave\` integer
  );
  `)
  await db.run(sql`CREATE INDEX \`_profile_v_version_version__status_idx\` ON \`_profile_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_profile_v_created_at_idx\` ON \`_profile_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_profile_v_updated_at_idx\` ON \`_profile_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_profile_v_latest_idx\` ON \`_profile_v\` (\`latest\`);`)
  await db.run(sql`CREATE INDEX \`_profile_v_autosave_idx\` ON \`_profile_v\` (\`autosave\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`profile_love\`;`)
  await db.run(sql`DROP TABLE \`profile_skill_groups_items\`;`)
  await db.run(sql`DROP TABLE \`profile_skill_groups\`;`)
  await db.run(sql`DROP TABLE \`profile_contacts\`;`)
  await db.run(sql`DROP TABLE \`profile\`;`)
  await db.run(sql`DROP TABLE \`_profile_v_version_love\`;`)
  await db.run(sql`DROP TABLE \`_profile_v_version_skill_groups_items\`;`)
  await db.run(sql`DROP TABLE \`_profile_v_version_skill_groups\`;`)
  await db.run(sql`DROP TABLE \`_profile_v_version_contacts\`;`)
  await db.run(sql`DROP TABLE \`_profile_v\`;`)
}
