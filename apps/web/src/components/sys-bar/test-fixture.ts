import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { withAppProviders } from '@components/app-providers';

import { SYS_BAR_TAG } from './element';
import { SysBar } from './index';

// Browser-test fixture: the markup sys-bar.astro renders — the React SysBar's (asserted
// by sys-bar.astro.test.ts) inside <sys-bar> — mounted into the document.
const SysBarAt = withAppProviders(SysBar);

export const mountSysBar = (pathname: string, style = ''): { element: Element; remove: () => void } => {
  const container = document.createElement('div');
  container.style.cssText = style;
  container.innerHTML = `<${SYS_BAR_TAG}>${renderToStaticMarkup(createElement(SysBarAt, { pathname, props: { initialTime: '12:34:56' } }))}</${SYS_BAR_TAG}>`;
  document.body.appendChild(container);
  const element = container.querySelector(SYS_BAR_TAG);
  if (element === null) throw new Error('not rendered');
  return { element, remove: () => container.remove() };
};
