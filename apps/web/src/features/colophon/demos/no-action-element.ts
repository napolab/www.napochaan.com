// `<no-action>` — the framework-free replacement of the `NoAction` React island
// (formerly ./no-action.tsx) for the colophon demos. Client-only: imported solely from
// ./no-action.astro's bundled `<script>`.
//
// Colophon rule: showcased links keep a realistic href but must never navigate. A
// capture-phase click listener on the wrapper calls preventDefault before anything
// below it sees the click, which stops:
// - native anchors (the browser skips the default action),
// - Astro's <ClientRouter /> (its document click handler bails on defaultPrevented),
// - react-aria Links inside a nested island (RAC checks isDefaultPrevented before
//   invoking the client router; React's root listener runs after this capture).
//
// Shape: a `display: contents` wrapper (class set in the .astro), so demo layout is
// untouched — same box tree as the old island's <astro-island> + div.
export const NO_ACTION_TAG = 'no-action';

const preventNavigation = (event: Event) => {
  event.preventDefault();
};

export class NoActionElement extends HTMLElement {
  connectedCallback() {
    this.addEventListener('click', preventNavigation, { capture: true });
  }

  disconnectedCallback() {
    this.removeEventListener('click', preventNavigation, { capture: true });
  }
}

// Idempotent: the bundled script may evaluate again (HMR, a second bundle).
export const defineNoActionElement = () => {
  if (customElements.get(NO_ACTION_TAG) !== undefined) return;
  customElements.define(NO_ACTION_TAG, NoActionElement);
};
