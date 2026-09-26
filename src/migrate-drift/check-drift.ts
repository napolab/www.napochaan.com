import payload, { readMigrationFiles } from 'payload';

import { d1Database } from '../payload.config';

import { buildDriftMessage } from './build-drift-message';
import { findOrphanMigrations } from './find-orphan-migrations';
import { resolveDeployEnv } from './resolve-deploy-env';

import type { AppliedMigration } from './find-orphan-migrations';
import type { Payload, SanitizedConfig } from 'payload';

// Payload bin script entry point. Invoked by `pnpm payload migrate:check-drift`
// (CI: `pnpm deploy:database:check:{staging,production}` right before migrate).
// Per Payload's custom bin spec the function MUST be a named `script` export.
//
// `payload migrate` only walks LOCAL migration files, so a migration applied in D1
// whose file was removed (e.g. its PR was reverted) is skipped silently. This guard
// turns that drift into a hard failure with a recovery hint.

// A fresh database has no `payload_migrations` table yet — nothing can drift.
const hasMigrationTable = async (db: D1Database): Promise<boolean> => {
  const row = await db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'payload_migrations'").first();
  return row !== null;
};

const readAppliedMigrations = async (instance: Payload): Promise<AppliedMigration[]> => {
  if (!(await hasMigrationTable(d1Database))) return [];

  const { docs } = await instance.find({ collection: 'payload-migrations', pagination: false, sort: 'name' });
  return docs.map(({ name, batch }) => ({ name, batch }));
};

// Same source `payload migrate` uses (readMigrationFiles over config.db.migrationDir).
const readLocalMigrationNames = async (instance: Payload): Promise<string[]> => {
  const files = await readMigrationFiles({ payload: instance });
  return files.map(({ name }) => name);
};

// Returns the process exit code: 0 = no drift, 1 = drift found.
const checkDrift = async (config: SanitizedConfig): Promise<0 | 1> => {
  await payload.init({ config });

  const orphans = findOrphanMigrations(await readAppliedMigrations(payload), await readLocalMigrationNames(payload));
  if (orphans.length === 0) {
    payload.logger.info('[migrate:check-drift] OK: D1 に適用済みのマイグレーションはすべてコードに存在します');
    return 0;
  }

  console.error(buildDriftMessage({ orphans, env: resolveDeployEnv(process.env.CLOUDFLARE_ENV) }));
  return 1;
};

// Payload's bin runner logs a rejected script and still exits 0, so every failure
// path must set the exit code explicitly or CI would deploy past a broken check.
export const script = async (config: SanitizedConfig): Promise<void> => {
  try {
    process.exit(await checkDrift(config));
  } catch (error) {
    console.error('[migrate:check-drift] ドリフト検査自体が失敗しました。デプロイを中断します。', error);
    process.exit(1);
  }
};
