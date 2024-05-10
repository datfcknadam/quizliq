import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { EventService } from 'src/libs/event/src';

@Injectable()
export class GameUserService {
  private sockets: Server = null;

  constructor(private readonly eventService: EventService) {}

  public provideSocktes(sockets: Server) {
    this.sockets = sockets;
  }

  public getClientsInRoom(roomId: string): string[] {
    const socketsMap = this.sockets.sockets.adapter;
    const sockets = socketsMap.rooms.get(roomId);
    if (!sockets) {
      return [];
    }
    return [...sockets.values()];
  }

  public async setActiveUser(roomId: string, clientId: string | 0) {
    this.sockets.to(roomId).emit('game', {
      method: 'setActiveUser',
      payload: { clientId: clientId },
    });
  }

  public async addUsersToStack(roomId: string, users: string[]) {
    await this.eventService.client.rPush(`game:${roomId}:stack`, users);
  }

  public async getLenUsersStack(roomId: string) {
    return this.eventService.client.lLen(`game:${roomId}:stack`);
  }

  public async popStack(roomId: string) {
    return this.eventService.client.lPop(`game:${roomId}:stack`);
  }

  public async cleanUserStack(roomId: string) {
    return this.eventService.client.del(`game:${roomId}:stack`);
  }

  public async removeUserStack(roomId: string, clientId: string) {
    return this.eventService.client.lRem(`game:${roomId}:stack`, 0, clientId);
  }

  public async getUserStackByIndex(roomId: string, index: number) {
    return this.eventService.client.lIndex(`game:${roomId}:stack`, index);
  }

  public async commitChoice(
    roomId: string,
    clientId: string,
    data: { choice: string; responseTime: number },
  ) {
    await this.eventService.client.hSet(`game:${roomId}:choice:${clientId}`, {
      choice: data.choice,
      responseTime: data.responseTime,
    });
  }

  public async getChoices(roomId: string) {
    const data = await this.eventService.client.hGetAll(
      `game:${roomId}:choice`,
    );
    await this.eventService.client.del(`game:${roomId}:choice`);
    return data;
  }
}
