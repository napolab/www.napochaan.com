import { describe, expect, it } from 'vitest';

import { buildDriftMessage } from './index';

describe('buildDriftMessage', () => {
  const orphans = ['20260720_121330_legal_documents', '20260720_155000_legal_documents_autosave'];

  it('states the problem in its first line', () => {
    const [firstLine] = buildDriftMessage({ orphans, env: 'staging' }).split('\n');

    expect(firstLine).toContain('D1 に適用済みのマイグレーションがコードに存在しません');
  });

  it('lists every orphan name verbatim', () => {
    const message = buildDriftMessage({ orphans, env: 'staging' });

    for (const name of orphans) {
      expect(message).toContain(`- ${name}`);
    }
  });

  it('includes the three recovery paths with env-specific commands', () => {
    const message = buildDriftMessage({ orphans, env: 'production' });

    expect(message).toContain('CLOUDFLARE_ENV=production pnpm payload migrate:status');
    expect(message).toContain('CLOUDFLARE_ENV=production pnpm payload migrate:down');
    expect(message).toContain('最新バッチ');
    expect(message).toContain('Time Travel');
    expect(message).toContain('docs/migration-rollback.md');
  });

  it('omits the CLOUDFLARE_ENV prefix for the local database', () => {
    const message = buildDriftMessage({ orphans, env: undefined });

    expect(message).not.toContain('CLOUDFLARE_ENV=');
    expect(message).toContain('pnpm payload migrate:down');
  });

  it('matches the full recovery hint', () => {
    expect(buildDriftMessage({ orphans: ['20260720_121330_legal_documents'], env: 'staging' })).toMatchInlineSnapshot(`
      "D1 に適用済みのマイグレーションがコードに存在しません（revert 等でファイルが消えた可能性があります）。このままデプロイすると、コードと D1 スキーマが食い違ったまま動きます。

      対象DB: staging
      孤立したマイグレーション:
        - 20260720_121330_legal_documents

      復旧手順（どれか1つ）:
        (a) コードの revert が誤りだった場合
            → 上記マイグレーションファイル（.ts / .json と migrations/index.ts のエントリ）をコードに戻して再デプロイしてください。
        (b) スキーマも本当にロールバックしたい場合
            1. revert 前のコミットを checkout する（down 関数はそこにしか無い）
            2. CLOUDFLARE_ENV=staging pnpm payload migrate:status で対象が最新バッチにあることを確認する
            3. CLOUDFLARE_ENV=staging pnpm payload migrate:down を実行する（migrate:down は最新バッチを丸ごと戻す点に注意）
            4. revert 後のコミットで再デプロイする
        (c) 破壊的マイグレーション（DROP TABLE / DROP COLUMN 等）の場合
            → down でスキーマは戻ってもデータは戻りません。D1 Time Travel で復元してください。

      詳細: docs/migration-rollback.md"
    `);
  });
});
