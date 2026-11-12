import { describe, expect, it } from 'vitest';

import { ClientMessage, ServerMessage } from './protocol';

describe('protocol', () => {
  it('accepts a valid move command (carries the current path)', () => {
    expect(ClientMessage.safeParse({ t: 'move', path: '/about', x: 0.5, y: 0.2 }).success).toBe(true);
  });

  it('accepts a valid nav command', () => {
    expect(ClientMessage.safeParse({ t: 'nav', path: '/about' }).success).toBe(true);
  });

  it('rejects unknown command / missing fields', () => {
    expect(ClientMessage.safeParse({ t: 'jump', x: 0, y: 0 }).success).toBe(false);
    expect(ClientMessage.safeParse({ t: 'move', path: '/about', x: 0.5 }).success).toBe(false);
    expect(ClientMessage.safeParse({ t: 'move', x: 0.5, y: 0.2 }).success).toBe(false); // missing path
    expect(ClientMessage.safeParse({ t: 'nav' }).success).toBe(false);
  });

  it('parses server messages by discriminator', () => {
    expect(ServerMessage.safeParse({ t: 'count', n: 3 }).success).toBe(true);
    expect(ServerMessage.safeParse({ t: 'move', id: 'x', x: 0.1, y: 0.2 }).success).toBe(true);
    expect(ServerMessage.safeParse({ t: 'welcome', self: { id: 'x', color: 'blue', label: '#x' } }).success).toBe(true);
  });
});
