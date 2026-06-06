import { describe, expect, it } from 'vitest';

import { ClientMessage, ServerMessage } from './protocol';

describe('protocol', () => {
  it('accepts a valid move command', () => {
    expect(ClientMessage.safeParse({ t: 'move', nx: 0.5, ny: 0.2 }).success).toBe(true);
  });

  it('rejects unknown command / missing fields', () => {
    expect(ClientMessage.safeParse({ t: 'jump', nx: 0, ny: 0 }).success).toBe(false);
    expect(ClientMessage.safeParse({ t: 'move', nx: 0.5 }).success).toBe(false);
  });

  it('parses server messages by discriminator', () => {
    expect(ServerMessage.safeParse({ t: 'count', n: 3 }).success).toBe(true);
    expect(ServerMessage.safeParse({ t: 'move', id: 'x', nx: 0.1, ny: 0.2 }).success).toBe(true);
    expect(ServerMessage.safeParse({ t: 'welcome', self: { id: 'x', color: 'blue', label: '#x' } }).success).toBe(true);
  });
});
