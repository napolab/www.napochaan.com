import { Component } from 'react';

import type { ReactNode } from 'react';

type Props = { fallback: ReactNode; children: ReactNode };
type State = { failed: boolean };

// Catches a failed menu chunk (e.g. a stale client after a redeploy) so the SysBar
// keeps rendering: the fallback is the same trigger face, the menu just cannot open.
// A local class instead of a dependency — this is the one boundary the initial
// bundle needs, and it only has to swap to a static fallback.
export class MenuBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  render() {
    if (this.state.failed) return this.props.fallback;
    return this.props.children;
  }
}
