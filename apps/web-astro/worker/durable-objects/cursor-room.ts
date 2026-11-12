import { BroadcastMessage } from 'durabcast';

import { deriveIdentity } from '../../src/lib/cursor/identity';
import { ClientMessage, type ServerMessage } from '../../src/lib/cursor/protocol';

import type { WebSocketAttachment } from 'durabcast';
import type { Env } from 'hono';

type CursorBindings = { Bindings: Cloudflare.Env };

// durabcast sets { roomId, uid, connectedAt } once and never rewrites it, so adding `path`
// (the socket's current page) and `lastMove` (the socket's last broadcast move timestamp) is safe —
// base broadcast/isAliveSocket only read uid/connectedAt.
type CursorAttachment = WebSocketAttachment & { path?: string; lastMove?: number };

// Server-side move throttle: at most one broadcast per socket per interval. The last-move timestamp
// lives on the WebSocket attachment (survives hibernation, no storage row write/delete per move) so a
// fast client can't fan out 60+/sec. Kept in sync with the client's MOVE_SEND_INTERVAL_MS
// (src/lib/cursor/visitor-pointer-app.ts); ~10/s, since the receiver lerps between samples.
const MOVE_BROADCAST_INTERVAL_MS = 100;

const safeJsonParse = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
};

export class CursorRoom extends BroadcastMessage<CursorBindings & Env> {
  #attachmentOf(ws: WebSocket): CursorAttachment {
    return ws.deserializeAttachment();
  }

  // Guarded single send: drop a socket that can no longer receive (abrupt disconnect) instead of
  // letting the throw abort a whole fan-out.
  #send(ws: WebSocket, message: string): void {
    try {
      ws.send(message);
    } catch {
      this.sessions.delete(ws);
    }
  }

  #broadcastToPath(path: string, message: string, exclude?: WebSocket): void {
    for (const ws of this.ctx.getWebSockets()) {
      if (exclude !== undefined && ws === exclude) continue;
      if (this.#attachmentOf(ws).path !== path) continue;
      this.#send(ws, message);
    }
  }

  // Presence is keyed by uid (identity), NOT by socket: one visitor can hold several sockets (tabs),
  // all sharing the same IP-derived uid. Count distinct uids so multi-tab sessions count as one.
  #countOnPath(path: string, exclude?: WebSocket): number {
    const uids = new Set<string>();
    for (const ws of this.ctx.getWebSockets()) {
      if (ws === exclude) continue;
      const att = this.#attachmentOf(ws);
      if (att.path === path) uids.add(att.uid);
    }

    return uids.size;
  }

  // True if another socket (≠ exclude) for the same uid is on `path`. Used so join fires only on a
  // uid's first arrival and leave only on its last departure (otherwise closing one tab evicts the
  // visitor's cursor for everyone while another tab is still open).
  #hasUidOnPath(path: string, uid: string, exclude: WebSocket): boolean {
    for (const ws of this.ctx.getWebSockets()) {
      if (ws === exclude) continue;
      const att = this.#attachmentOf(ws);
      if (att.path === path && att.uid === uid) return true;
    }

    return false;
  }

  #broadcastCount(path: string, exclude?: WebSocket): void {
    const message = JSON.stringify({ t: 'count', n: this.#countOnPath(path, exclude) } satisfies ServerMessage);
    this.#broadcastToPath(path, message, exclude);
  }

  // Apply the page carried by a message: if it differs from the socket's current page, move the
  // socket and broadcast the leave/join/count transition. No-op when the page is unchanged. Every
  // client message (nav and move) flows through here, so presence stays correct on navigation.
  #applyPath(ws: WebSocket, att: CursorAttachment, nextPath: string): void {
    const prevPath = att.path;
    if (prevPath === nextPath) return;
    const { id, color, label } = deriveIdentity(att.uid);

    // Move this socket onto the new page first so the counts below place it correctly.
    ws.serializeAttachment({ ...att, path: nextPath } satisfies CursorAttachment);

    if (prevPath !== undefined) {
      // Leave the old page only when this uid's LAST socket leaves it (multi-tab keeps the cursor).
      if (!this.#hasUidOnPath(prevPath, att.uid, ws)) {
        this.#broadcastToPath(prevPath, JSON.stringify({ t: 'leave', id } satisfies ServerMessage), ws);
      }
      this.#broadcastCount(prevPath);
    }

    // Always announce arrival — peers key cursors by id, so a same-uid second tab just re-asserts the
    // same cursor (no duplicate). Suppressing it would hide same-uid tabs from each other.
    this.#broadcastToPath(nextPath, JSON.stringify({ t: 'join', id, color, label } satisfies ServerMessage), ws);
    // Replay existing peers (deduped by uid) so this socket sees who's already here.
    const replayed = new Set<string>();
    for (const peer of this.ctx.getWebSockets()) {
      if (peer === ws) continue;
      const peerAtt = this.#attachmentOf(peer);
      if (peerAtt.path !== nextPath || replayed.has(peerAtt.uid)) continue;
      replayed.add(peerAtt.uid);
      const peerId = deriveIdentity(peerAtt.uid);
      this.#send(ws, JSON.stringify({ t: 'join', id: peerId.id, color: peerId.color, label: peerId.label } satisfies ServerMessage));
    }
    this.#broadcastCount(nextPath);
  }

  #handleMove(ws: WebSocket, path: string, x: number, y: number): void {
    const att = this.#attachmentOf(ws); // re-read: #applyPath may have just rewritten the attachment
    const now = Date.now();
    if (now - (att.lastMove ?? 0) < MOVE_BROADCAST_INTERVAL_MS) return;
    ws.serializeAttachment({ ...att, lastMove: now } satisfies CursorAttachment);
    this.#broadcastToPath(path, JSON.stringify({ t: 'move', id: att.uid, x, y } satisfies ServerMessage), ws);
  }

  override webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): void {
    if (typeof message !== 'string' || message === this.REQUEST_RESPONSE_PAIR.request) return;
    const parsed = ClientMessage.safeParse(safeJsonParse(message));
    if (!parsed.success) return;
    const att = this.#attachmentOf(ws);
    // Every message carries the page — apply the transition first (no-op if unchanged).
    this.#applyPath(ws, att, parsed.data.path);
    if (parsed.data.t === 'move') {
      this.#handleMove(ws, parsed.data.path, parsed.data.x, parsed.data.y);
    }
  }

  override webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean): void {
    const att = this.#attachmentOf(ws);
    const path = att.path;
    if (path !== undefined) {
      // Emit leave only when this uid's last socket on the page is closing (keep the cursor alive
      // while another tab of the same visitor remains).
      if (!this.#hasUidOnPath(path, att.uid, ws)) {
        const { id } = deriveIdentity(att.uid);
        this.#broadcastToPath(path, JSON.stringify({ t: 'leave', id } satisfies ServerMessage), ws);
      }
      this.#broadcastCount(path, ws);
    }
    super.webSocketClose(ws, code, reason, wasClean);
  }
}
