import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { EventService } from 'src/libs/event/src';

@Injectable()
export default class GameUserService {
  private sockets: Server = null;

  constructor(private readonly eventService: EventService) {}

  public provideSocktes(sockets: Server) {
    this.sockets = sockets;
  }

  public getSocketsInRoom(roomId: string): Set<string> {
    const socketsMap = this.sockets.sockets.adapter;
    return socketsMap.rooms.get(roomId);
  }

  public async nextActiveUser(roomId: string): Promise<string | false> {
    try {
      const sockets = this.getSocketsInRoom(roomId);
      if (!sockets) {
        this.setActiveUser(roomId, 0);
        return false;
      }
      const users = [...sockets.values()];
      const activeUser = await this.getActiveUser(roomId);
      const activeUserIndex = users.findIndex(
        (userId) => userId === activeUser,
      );
      if ([users.length - 1, -1].includes(activeUserIndex)) {
        this.setActiveUser(roomId, users[0]);
        return users[0];
      }

      this.setActiveUser(roomId, users[activeUserIndex + 1]);
      return users[activeUserIndex];
    } catch (e) {
      console.error(e);
    }
  }

  public async getActiveUser(roomId: string): Promise<string> {
    return this.eventService.client.get(`game:${roomId}:activeUser`);
  }

  public async setActiveUser(roomId: string, clientId: string | 0) {
    this.eventService.client.set(`game:${roomId}:activeUser`, clientId);
    this.sockets.to(roomId).emit('game', {
      method: 'setActiveUser',
      payload: { clientId: clientId },
    });
  }
}
