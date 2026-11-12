// A row of the `payload_migrations` table, narrowed to what drift detection reads.
// `name` is nullable in the generated PayloadMigration type; Payload always writes
// it, and a nameless row cannot be matched to (or restored from) any file, so it is skipped.
export type AppliedMigration = {
  name: string | null | undefined;
  batch: number | null | undefined;
};

// Payload records dev-mode schema pushes with batch -1 (name usually `dev`).
// They never correspond to a migration file, so they are not drift.
const DEV_PUSH_BATCH = -1;

// Applied migrations (in DB order) that no longer exist as local migration files —
// e.g. the PR that added them was `git revert`ed. `payload migrate` only iterates
// local files, so these are silently skipped and code/schema drift unnoticed.
export const findOrphanMigrations = (applied: readonly AppliedMigration[], localNames: readonly string[]): string[] => {
  const local = new Set(localNames);

  return applied.flatMap(({ name, batch }) => {
    if (batch === DEV_PUSH_BATCH) return [];
    if (name === null || name === undefined || local.has(name)) return [];
    return [name];
  });
};
