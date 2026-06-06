import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { ErrorScreen } from './index';

describe('ErrorScreen', () => {
  it('renders the code as the page h1', async () => {
    await render(<ErrorScreen code="404" kind="not found" lead="お探しのページは存在しません。" tag="▸ not found" />);
    await expect.element(page.getByRole('heading', { level: 1, name: '404' })).toBeInTheDocument();
  });

  it('renders the kicker built from code and kind', async () => {
    await render(<ErrorScreen code="404" kind="not found" lead="お探しのページは存在しません。" tag="▸ not found" />);
    await expect.element(page.getByText('// 404 — not found')).toBeInTheDocument();
  });

  it('renders the lead', async () => {
    await render(<ErrorScreen code="404" kind="not found" lead="お探しのページは存在しません。" tag="▸ not found" />);
    await expect.element(page.getByText('お探しのページは存在しません。')).toBeInTheDocument();
  });

  it('renders the danger tag annotation', async () => {
    await render(<ErrorScreen code="404" kind="not found" lead="お探しのページは存在しません。" tag="▸ not found" />);
    await expect.element(page.getByText('▸ not found')).toBeInTheDocument();
  });

  it('renders the action children', async () => {
    await render(
      <ErrorScreen code="404" kind="not found" lead="お探しのページは存在しません。" tag="▸ not found">
        <a href="/">← / へ戻る</a>
      </ErrorScreen>,
    );
    await expect.element(page.getByRole('link', { name: '← / へ戻る' })).toBeInTheDocument();
  });

  it('omits the actions container when no children are provided', async () => {
    await render(<ErrorScreen code="404" kind="not found" lead="お探しのページは存在しません。" tag="▸ not found" />);
    await expect.element(page.getByText('← / へ戻る')).not.toBeInTheDocument();
  });
});
