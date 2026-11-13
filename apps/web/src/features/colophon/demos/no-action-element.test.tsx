import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { NO_ACTION_TAG, defineNoActionElement } from './no-action-element';

const mount = (html: string) => {
  const container = document.createElement('div');
  container.innerHTML = html;
  document.body.appendChild(container);
  return container;
};

// Dispatches a cancelable click on `target` and reports whether anything prevented it.
const clickPrevented = (target: Element) => {
  const event = new MouseEvent('click', { bubbles: true, cancelable: true });
  target.dispatchEvent(event);
  return event.defaultPrevented;
};

describe('<no-action>', () => {
  beforeEach(() => {
    defineNoActionElement();
  });

  afterEach(() => {
    document.body.replaceChildren();
  });

  it('registers once (re-running the bundled script is a no-op)', () => {
    expect(() => defineNoActionElement()).not.toThrow();
    expect(customElements.get(NO_ACTION_TAG)).toBeDefined();
  });

  it('prevents navigation of every link inside it', () => {
    const container = mount(`<${NO_ACTION_TAG}><nav><a href="/works"><span>works</span></a></nav></${NO_ACTION_TAG}>`);
    const label = container.querySelector('span');
    if (label === null) throw new Error('not rendered');
    expect(clickPrevented(label)).toBe(true);
  });

  // Capture phase: the prevention must already be set when a listener deeper in the
  // tree (a React island root inside the slot, react-aria's Link) sees the click.
  it('prevents the click before a descendant listener runs', () => {
    const container = mount(`<${NO_ACTION_TAG}><div id="inner"><a href="/x">x</a></div></${NO_ACTION_TAG}>`);
    const inner = container.querySelector('#inner');
    const link = container.querySelector('a');
    if (inner === null || link === null) throw new Error('not rendered');
    const seen = { prevented: false };
    inner.addEventListener('click', (event) => {
      seen.prevented = event.defaultPrevented;
    });
    clickPrevented(link);
    expect(seen.prevented).toBe(true);
  });

  it('leaves clicks outside it alone', () => {
    const container = mount(`<${NO_ACTION_TAG}><a href="/in">in</a></${NO_ACTION_TAG}><a id="out" href="/out">out</a>`);
    const out = container.querySelector('#out');
    if (out === null) throw new Error('not rendered');
    expect(clickPrevented(out)).toBe(false);
  });

  it('stops preventing once disconnected', () => {
    const container = mount(`<${NO_ACTION_TAG}><a href="/x">x</a></${NO_ACTION_TAG}>`);
    const element = container.querySelector(NO_ACTION_TAG);
    const link = container.querySelector('a');
    if (element === null || link === null) throw new Error('not rendered');
    element.remove();
    const detached = document.createElement('div');
    detached.appendChild(element);
    document.body.appendChild(detached);
    expect(clickPrevented(link)).toBe(true);
    element.remove();
    expect(clickPrevented(link)).toBe(false);
  });
});
