import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { AmbientPointer } from './index';

describe('AmbientPointer', () => {
  it('renders the label and the target', async () => {
    await render(<AmbientPointer label="いま囲ってる枠" target="TypographyBand" />);

    await expect.element(page.getByText('いま囲ってる枠', { exact: false })).toBeInTheDocument();
    await expect.element(page.getByText('TypographyBand', { exact: false })).toBeInTheDocument();
  });

  it('renders as a list item', async () => {
    await render(
      <ul>
        <AmbientPointer label="いま囲ってる枠" target="TypographyBand" />
      </ul>,
    );

    await expect.element(page.getByRole('listitem')).toBeInTheDocument();
  });
});
