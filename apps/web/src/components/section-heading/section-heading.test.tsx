import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { SectionHeading } from './index';

describe('SectionHeading', () => {
  it('renders the number and a heading title', async () => {
    await render(
      <SectionHeading no="01" level={2}>
        works
      </SectionHeading>,
    );
    await expect.element(page.getByText('01')).toBeInTheDocument();
    await expect.element(page.getByRole('heading', { level: 2, name: /works/ })).toBeInTheDocument();
  });
});
