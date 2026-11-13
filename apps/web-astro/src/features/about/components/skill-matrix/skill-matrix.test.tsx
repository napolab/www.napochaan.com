import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { SkillMatrix } from './index';

const groups = [
  { category: 'lang', items: ['TypeScript', 'Rust'] },
  { category: 'infra', items: ['Cloudflare'] },
];

describe('SkillMatrix', () => {
  it('renders each category label', async () => {
    await render(<SkillMatrix groups={groups} />);

    await expect.element(page.getByText('lang', { exact: true })).toBeInTheDocument();
    await expect.element(page.getByText('infra', { exact: true })).toBeInTheDocument();
  });

  it('renders each skill chip across groups', async () => {
    await render(<SkillMatrix groups={groups} />);

    await expect.element(page.getByText('TypeScript')).toBeInTheDocument();
    await expect.element(page.getByText('Rust')).toBeInTheDocument();
    await expect.element(page.getByText('Cloudflare')).toBeInTheDocument();
  });
});
