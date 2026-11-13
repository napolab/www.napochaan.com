import { navigate } from 'astro:transitions/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';

import { Link } from '@components/link';
import { usePrefersReducedMotion } from '@hooks/use-prefers-reduced-motion';
import { usePathname } from '@lib/navigation';

import { AppProviders, withAppProviders } from './index';

import { createElement } from 'react';

import type { ReactNode } from 'react';

const NavProbe = ({ href }: { href: string }) => {
  const pathname = usePathname();

  return (
    <Link href={href} data-testid="link">
      {`at ${pathname}`}
    </Link>
  );
};

const NavIsland = withAppProviders(NavProbe);

afterEach(() => {
  vi.mocked(navigate).mockClear();
});

describe('AppProviders', () => {
  it('routes a react-aria Link through Astro navigate instead of a full load', async () => {
    await render(
      <AppProviders pathname="/works">
        <NavProbe href="/blog" />
      </AppProviders>,
    );

    await page.getByTestId('link').click();

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('/blog');
  });

  it('feeds usePathname from the server pathname prop', async () => {
    await render(
      <AppProviders pathname="/works/alpha">
        <NavProbe href="/blog" />
      </AppProviders>,
    );

    await expect.element(page.getByTestId('link')).toHaveTextContent('at /works/alpha');
  });

  it('supplies the motion provider so reduced-motion consumers resolve', async () => {
    const Probe = () => <output data-testid="reduced">{`${usePrefersReducedMotion()}`}</output>;
    await render(
      <AppProviders pathname="/">
        <Probe />
      </AppProviders>,
    );

    await expect.element(page.getByTestId('reduced')).toHaveTextContent(/true|false/);
  });
});

describe('withAppProviders', () => {
  it('wraps an island component and forwards its props', async () => {
    await render(<NavIsland pathname="/about" props={{ href: '/news' }} />);

    await expect.element(page.getByTestId('link')).toHaveTextContent('at /about');
    await expect.element(page.getByTestId('link')).toHaveAttribute('href', '/news');
  });

  // Astro hands an island its slots as props: `children` for the default slot and the
  // slot name for named slots (each an <astro-slot> of static HTML).
  it('forwards Astro slots (children and named) to the component', async () => {
    const Framed = ({ title, children }: { title?: ReactNode; children?: ReactNode }) => (
      <section data-testid="framed">
        <h2>{title}</h2>
        {children}
      </section>
    );
    const FramedIsland = withAppProviders(Framed);
    await render(
      <FramedIsland pathname="/" props={{}} title={<span>named slot</span>}>
        <p>default slot</p>
      </FramedIsland>,
    );

    await expect.element(page.getByRole('heading', { name: 'named slot' })).toBeInTheDocument();
    await expect.element(page.getByText('default slot')).toBeInTheDocument();
  });

  // The client hydrator calls createElement(Island, props, undefined) when there is no
  // default slot, so `children: undefined` arrives next to `props` and must not
  // clobber a `children` passed inside `props` (e.g. ScrambleText's text).
  it('keeps props.children when the hydrator passes an undefined default slot', async () => {
    const Text = ({ children }: { children?: ReactNode }) => <p data-testid="text">{children}</p>;
    const TextIsland = withAppProviders(Text);
    await render(createElement(TextIsland, { pathname: '/', props: { children: 'from props' } }, undefined));

    await expect.element(page.getByTestId('text')).toHaveTextContent('from props');
  });

  it('fails loudly when an island is mounted without a pathname', () => {
    const Island = withAppProviders(() => null);
    const props: { pathname: string; props: Record<string, never> } = JSON.parse('{"props":{}}');

    expect(() => Island(props)).toThrowError(/pathname/);
  });
});
