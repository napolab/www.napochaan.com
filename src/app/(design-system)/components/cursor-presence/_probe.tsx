'use client';

import { useCallback } from 'react';
import { Button } from 'react-aria-components';

import { css } from '@styled/css';

import { usePresence } from '@components/cursor-presence/presence-context';

const probeRoot = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'element',
  alignItems: 'flex-start',
});

const stat = css({ fontFamily: 'mono', fontSize: 'sm', color: 'fg.muted' });

const toggle = css({
  fontFamily: 'mono',
  fontSize: 'sm',
  px: '4',
  py: '2',
  borderWidth: 'default',
  borderStyle: 'solid',
  borderColor: 'border.default',
  cursor: 'pointer',
  '&[data-enabled]': {
    borderColor: 'accent.solid',
    color: 'accent.solid',
  },
  '&[data-hovered]': { opacity: 'overlay' },
});

export const PresenceProbe = () => {
  const { count, enabled, toggle: togglePresence } = usePresence();

  const handleToggle = useCallback(() => {
    togglePresence();
  }, [togglePresence]);

  return (
    <div className={probeRoot}>
      <p className={stat}>watching {count}</p>
      <Button className={toggle} data-enabled={enabled || undefined} onPress={handleToggle}>
        {enabled ? 'enabled' : 'disabled'}
      </Button>
    </div>
  );
};
