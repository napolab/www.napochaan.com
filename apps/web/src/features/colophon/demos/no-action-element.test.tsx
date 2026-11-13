import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { NO_ACTION_TAG, defineNoActionElement } from './no-action-element';

const mount = (html: string) => {
  const container = document.createElement('div');
  container.innerHTML = html;
  document.body.appendChild(container);
  return container;
};

// Dispatches a cancelable click on `target` and reports whether <no-action> prevented
// it. A window listener (bubble phase, so after the element's capture listener) records
// the verdict and then ALWAYS cancels the click: a click that is allowed through would
// otherwise really navigate the test iframe ("Cannot connect to the iframe" in CI).
const clickPrevented = (target: Element) => {
  const seen = { prevented: false };
  const record = (event: Event) => {
    seen.prevented = event.defaultPrevented;
    event.preventDefault();
  };
  window.addEventListener('click', record);
  try {
    target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  } finally {
    window.removeEventListener('click', record);
  }
  return seen.prevented;
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

  // Detached, the click never reaches window, so the verdict is read on the link itself
  // (its own listener runs after the wrapper's capture listener, then cancels anyway).
  it('drops the listener while disconnected and re-binds on reconnect', () => {
    const container = mount(`<${NO_ACTION_TAG}><a href="/x">x</a></${NO_ACTION_TAG}>`);
    const element = container.querySelector(NO_ACTION_TAG);
    const link = container.querySelector('a');
    if (element === null || link === null) throw new Error('not rendered');
    const seen = { prevented: false };
    link.addEventListener('click', (event) => {
      seen.prevented = event.defaultPrevented;
      event.preventDefault();
    });
    const click = () => link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

    element.remove();
    click();
    expect(seen.prevented).toBe(false);

    container.appendChild(element);
    click();
    expect(seen.prevented).toBe(true);
  });
});
