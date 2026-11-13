import { INITIAL_HANDOFF } from './handoff';

import type { MenuHandoff } from './handoff';

// The static menu trigger's half of the handoff, framework-free: the <sys-bar> element
// wires the server-rendered react-aria Button face (./trigger-button) with plain DOM
// listeners until the react-aria menu chunk lands. It does what the React placeholder
// (./index.tsx) does through react-aria's press events:
//   - requests the chunk on the first intent (hover, focus, press start);
//   - remembers the press for the menu's mount (./handoff): a completed press reads
//     `open`, one still held at the swap reads `pressing`, and a keyboard / virtual
//     (screen reader) press asks for the first item to be focused, as react-aria does;
//   - sets data-hovered (mouse / pen only) and data-pressed the way react-aria's Button
//     does, so the face styles key on the same attributes before and after the swap.
// `read()` reports the handoff, including whether the trigger has focus right now.
export type TriggerTracker = {
  read: () => MenuHandoff;
  dispose: () => void;
};

const isPressKey = (event: KeyboardEvent): boolean => event.key === 'Enter' || event.key === ' ';

export const trackTrigger = (trigger: HTMLElement, onIntent: () => void): TriggerTracker => {
  const handoff: MenuHandoff = { ...INITIAL_HANDOFF };
  const abort = new AbortController();
  const options = { signal: abort.signal };

  const press = (focusStrategy: MenuHandoff['focusStrategy']) => {
    handoff.pressing = true;
    handoff.focusStrategy = focusStrategy;
    trigger.setAttribute('data-pressed', 'true');
    onIntent();
  };
  const release = () => {
    handoff.pressing = false;
    trigger.removeAttribute('data-pressed');
  };

  trigger.addEventListener(
    'pointerenter',
    (event) => {
      if (event.pointerType !== 'touch') trigger.setAttribute('data-hovered', 'true');
      onIntent();
    },
    options,
  );
  trigger.addEventListener('pointerleave', () => trigger.removeAttribute('data-hovered'), options);
  trigger.addEventListener('focus', onIntent, options);
  trigger.addEventListener(
    'pointerdown',
    (event) => {
      if (event.button !== 0) return;
      press(undefined);
    },
    options,
  );
  // A release dragged off the trigger never reaches it: listen on the document.
  document.addEventListener('pointerup', release, options);
  document.addEventListener('pointercancel', release, options);
  trigger.addEventListener(
    'keydown',
    (event) => {
      if (!isPressKey(event) || event.repeat) return;
      press('first');
    },
    options,
  );
  trigger.addEventListener(
    'keyup',
    (event) => {
      if (isPressKey(event)) release();
    },
    options,
  );
  // `click` completes every modality (pointer up on the trigger, Enter, Space, a screen
  // reader's virtual click — the latter two with detail 0).
  trigger.addEventListener(
    'click',
    (event) => {
      handoff.open = true;
      if (event.detail === 0) handoff.focusStrategy = 'first';
      onIntent();
    },
    options,
  );

  return {
    read: () => ({ ...handoff, focused: document.activeElement === trigger }),
    dispose: () => {
      abort.abort();
      trigger.removeAttribute('data-hovered');
      trigger.removeAttribute('data-pressed');
    },
  };
};
