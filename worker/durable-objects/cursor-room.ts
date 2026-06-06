import { BroadcastMessage } from 'durabcast';

import { deriveIdentity } from '../../src/lib/cursor/identity';
import { ClientMessage, type ServerMessage } from '../../src/lib/cursor/protocol';

import type { Env } from 'hono';

type CursorBindings = { Bindings: Cloudflare.Env };

const send = (ws: WebSocket, msg: ServerMessage): void => ws.send(JSON.stringify(msg));

export class CursorRoom extends BroadcastMessage<CursorBindings & Env> {
  protected count(): number {
    return this.ctx.getWebSockets().length;
  }

  protected broadcastCount(delta = 0): void {
    this.broadcast(JSON.stringify({ t: 'count', n: this.count() + delta } satisfies ServerMessage));
  }

  protected override async createRoom(roomId: string, uid: string): Promise<WebSocket> {
    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];

    this.ctx.acceptWebSocket(server);
    this.sessions.add(server);
    server.serializeAttachment({ roomId, uid, connectedAt: new Date() });

    const self = deriveIdentity(uid);
    send(server, { t: 'welcome', self });
    this.broadcast(JSON.stringify({ t: 'join', id: self.id, color: self.color, label: self.label } satisfies ServerMessage), {
      excludes: [server],
    });
    this.broadcastCount();

    if (this.AUTO_CLOSE) {
      const alarm = await this.ctx.storage.getAlarm();
      if (alarm === null) await this.ctx.storage.setAlarm(Date.now() + this.INTERVAL);
    }

    return client;
  }

  override webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): void {
    if (typeof message !== 'string') return;
    if (message === this.REQUEST_RESPONSE_PAIR.request) return;

    const parsed = ClientMessage.safeParse(JSON.parse(message));
    if (!parsed.success) {
      console.warn('[cursor] invalid client message', parsed.error.message);
      return;
    }

    const attachment: { uid: string } = ws.deserializeAttachment();
    this.broadcast(JSON.stringify({ t: 'move', id: attachment.uid, nx: parsed.data.nx, ny: parsed.data.ny } satisfies ServerMessage), { excludes: [ws] });
  }

  override webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean): void {
    const attachment: { uid: string } = ws.deserializeAttachment();
    this.sessions.delete(ws);
    this.broadcast(JSON.stringify({ t: 'leave', id: attachment.uid } satisfies ServerMessage), { excludes: [ws] });
    this.broadcastCount(-1);
  }
}
