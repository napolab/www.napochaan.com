import { describe, expect, it } from 'vitest';

import { withAppProviders } from '../app-providers';
import { renderComponent } from '../../test-utils/astro-container';
import { islandExportsOf, leafElementsOf, renderReactMarkup, stripIslands, stripScrambleHost } from '../../test-utils/island-parity';
import Twin from './sys-bar.astro';
import { SysBar } from './index';

const PERSIST = / data-astro-transition-persist="[^"]*"/g;
const initialTime = '12:34:56';

// The React SysBar reads the path from PathnameProvider.
const SysBarAt = withAppProviders(SysBar);

describe('sys-bar.astro', () => {
  // Hand-mirrored pair with the React SysBar (.claude/rules/cross-module-sync-test.md).
  it.each(['/', '/works/alpha', '/blog', '/colophon'])('renders the React SysBar markup at %s', async (pathname) => {
    const html = await renderComponent(Twin, { pathname, props: { initialTime } });
    expect(stripScrambleHost(stripIslands(html)).replace(PERSIST, '')).toBe(renderReactMarkup(SysBarAt, { pathname, props: { initialTime } }));
  });

  it('marks the active section from the request pathname on the server', async () => {
    const html = await renderComponent(Twin, { pathname: '/works/alpha', props: { initialTime } });
    const active = [...html.matchAll(/<a data-active="true"[^>]*href="([^"]+)"/g)].map((match) => match[1]);
    expect(active).toEqual(['/works']);
  });

  it('shows the stamped server time until the element takes over', async () => {
    const html = await renderComponent(Twin, { props: { initialTime } });
    expect(html).toContain(`data-status="clock">${initialTime}</span>`);
  });

  it('persists the <sys-bar> element itself and hydrates nothing (labels are <scramble-text> elements)', async () => {
    const html = await renderComponent(Twin, { props: { initialTime } });
    expect(html).toMatch(/<sys-bar class="[^"]+" data-astro-transition-persist="sys-bar"><header /);
    expect(islandExportsOf(html)).toEqual([]);
    expect(leafElementsOf(html)).toEqual(['sys-bar', ...Array.from({ length: 7 }, () => 'scramble-text')]);
  });

  // Plain links: Astro's ClientRouter soft-navigates them (the React island routed its
  // react-aria Links through `navigate`; the menu items still do, see element-menu.test).
  it('renders the section nav as plain links the ClientRouter soft-navigates', async () => {
    const html = await renderComponent(Twin, { props: { initialTime } });
    const nav = html.slice(html.indexOf('<nav '), html.indexOf('</nav>'));
    expect([...nav.matchAll(/<a [^>]*href="([^"]+)"/g)].map((match) => match[1])).toEqual(['/', '/about', '/works', '/news', '/log', '/gallery', '/blog']);
    expect(nav).not.toContain('data-astro-reload');
  });

  it('marks each nav slot as the hover host of its scramble label', async () => {
    const html = await renderComponent(Twin, { props: { initialTime } });
    expect(html.match(/<a [^>]*data-scramble-host[^>]*><scramble-text [^>]*trigger="group"/g)).toHaveLength(7);
  });
});
