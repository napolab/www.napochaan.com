import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { ScrambleText } from './index';

describe('ScrambleText', () => {
  it('renders the text at rest (scramble only fires on hover)', async () => {
    await render(<ScrambleText>hello world</ScrambleText>);
    // The text is rendered twice (width-reserving ghost + animated overlay).
    await expect.element(page.getByText('hello world').first()).toBeInTheDocument();
  });

  it('keeps the text as the accessible name even inside a link', async () => {
    await render(
      <a href="/x" aria-label="archive">
        <ScrambleText trigger="group">archive</ScrambleText>
      </a>,
    );
    await expect.element(page.getByRole('link', { name: 'archive' })).toBeInTheDocument();
  });
});
