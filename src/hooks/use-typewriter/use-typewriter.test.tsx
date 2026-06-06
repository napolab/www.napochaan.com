import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { useTypewriter } from './index';

const Probe = ({ text }: { text: string }) => {
  const { displayText } = useTypewriter(text, { speed: 5 });
  return <p data-testid="out">{displayText}</p>;
};

describe('useTypewriter', () => {
  it('reveals the full text over time', async () => {
    await render(<Probe text="napochaan" />);
    await expect.element(page.getByTestId('out')).toHaveTextContent('napochaan');
  });
});
