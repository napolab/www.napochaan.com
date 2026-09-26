import type { DeployEnv } from '../resolve-deploy-env';

type BuildDriftMessageArgs = {
  orphans: readonly string[];
  // undefined = the local (miniflare) database.
  env: DeployEnv | undefined;
};

const RUNBOOK_PATH = 'docs/migration-rollback.md';

const payloadCommand = (env: DeployEnv | undefined, command: string): string => {
  if (env === undefined) return `pnpm payload ${command}`;
  return `CLOUDFLARE_ENV=${env} pnpm payload ${command}`;
};

// Recovery hint printed when the drift guard fails. Written so a human or an LLM
// can pick the right path in one read (see .claude/rules/mcp-write-strict.md):
// what is wrong, the offending names verbatim, then every way out.
export const buildDriftMessage = ({ orphans, env }: BuildDriftMessageArgs): string =>
  [
    'D1 に適用済みのマイグレーションがコードに存在しません（revert 等でファイルが消えた可能性があります）。このままデプロイすると、コードと D1 スキーマが食い違ったまま動きます。',
    '',
    `対象DB: ${env ?? 'local'}`,
    '孤立したマイグレーション:',
    ...orphans.map((name) => `  - ${name}`),
    '',
    '復旧手順（どれか1つ）:',
    '  (a) コードの revert が誤りだった場合',
    '      → 上記マイグレーションファイル（.ts / .json と migrations/index.ts のエントリ）をコードに戻して再デプロイしてください。',
    '  (b) スキーマも本当にロールバックしたい場合',
    '      1. revert 前のコミットを checkout する（down 関数はそこにしか無い）',
    `      2. ${payloadCommand(env, 'migrate:status')} で対象が最新バッチにあることを確認する`,
    `      3. ${payloadCommand(env, 'migrate:down')} を実行する（migrate:down は最新バッチを丸ごと戻す点に注意）`,
    '      4. revert 後のコミットで再デプロイする',
    '  (c) 破壊的マイグレーション（DROP TABLE / DROP COLUMN 等）の場合',
    '      → down でスキーマは戻ってもデータは戻りません。D1 Time Travel で復元してください。',
    '',
    `詳細: ${RUNBOOK_PATH}`,
  ].join('\n');
