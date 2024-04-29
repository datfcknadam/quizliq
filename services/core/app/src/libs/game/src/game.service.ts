import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { EventService } from 'src/libs/event/src';

@Injectable()
export class GameService {
  methodsMap = {
    startGame: this.startGame,
    selectPosition: this.selectPosition,
  };

  constructor(private eventService: EventService) {}

  public initGameLoop(sockets: Server) {
    this.eventService.sub.subscribe(
      'game:loop',
      (message) => {
        const roomId = message.toString();
        this.nextActiveUser(sockets, roomId);
      },
      true,
    );
  }

  public interface(method: string, client: Socket, payload: unknown) {
    // todo: validate types
    const data = this.methodsMap[method].call(this, client, payload);
    return {
      method,
      payload: data,
    };
  }
  public async clientLeaveGame(roomId: string, client: Socket) {
    const activeUser = await this.getActiveUser(roomId);
    if (activeUser !== client.id) {
      return;
    }
    this.gameLoopIterate(roomId);
  }

  public async getActiveUser(roomId: string): Promise<string> {
    return this.eventService.client.get(`game:${roomId}:activeUser`);
  }

  private async nextActiveUser(
    sockets: Server,
    roomId: string,
  ): Promise<string> {
    const socketsMap = sockets.sockets.adapter;
    const users = [...socketsMap.rooms.get(roomId).values()];
    const activeUser = await this.getActiveUser(roomId);
    const activeUserIndex = users.findIndex((userId) => userId === activeUser);
    if ([users.length - 1, -1].includes(activeUserIndex)) {
      this.setActiveUser(sockets, roomId, users[0]);
      return users[0];
    }

    this.setActiveUser(sockets, roomId, users[activeUserIndex + 1]);
    return users[activeUserIndex];
  }

  private startGame(client: Socket, { roomId }: { roomId: string }) {
    client.to(roomId).emit('game', { method: 'startGame', payload: roomId });
    this.gameLoopIterate(roomId);
    return roomId;
  }

  private gameLoopIterate(roomId: string) {
    this.eventService.pub.publish('game:loop', Buffer.from(roomId));
  }

  private selectPosition(
    client: Socket,
    { roomId, position }: { roomId: string; position: string },
  ) {
    this.eventService.client.sAdd(`game:${roomId}:${position}`, client.id);
    client.to(roomId).emit('game', {
      method: 'selectPosition',
      payload: { position, clientId: client.id },
    });
    this.gameLoopIterate(roomId);
    return { position, clientId: client.id };
  }

  private setActiveUser(sockets: Server, roomId: string, clientId: string) {
    this.eventService.client.set(`game:${roomId}:activeUser`, clientId);
    console.log('activeUser', clientId);
    sockets.to(roomId).emit('game', {
      method: 'setActiveUser',
      payload: { clientId: clientId },
    });
  }
}
