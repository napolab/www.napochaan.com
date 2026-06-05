import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { EchoText } from './index';

describe('EchoText', () => {
  it('renders the text (echo layers hidden from a11y)', async () => {
    await render(<EchoText>napochaan</EchoText>);
    await expect.element(page.getByText('napochaan').first()).toBeInTheDocument();
  });
});
