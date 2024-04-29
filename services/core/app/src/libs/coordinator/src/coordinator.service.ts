import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { Socket } from 'socket.io';
import { GameService } from 'src/libs/game/src';

@Injectable()
export class CoordinatorService {
  constructor(private readonly gameService: GameService) {}

  methodsMap = {
    createRoom: this.createRoom,
    leaveRoom: this.leaveRoom,
    joinRoom: this.joinRoom,
  };

  private names = [
    { name: 'Red', color: 'red' },
    { name: 'Orange', color: 'orange' },
    { name: 'Yellow', color: 'yellow' },
    { name: 'Green', color: 'green' },
    { name: 'Blue', color: 'blue' },
    { name: 'Indigo', color: 'indigo' },
    { name: 'Violet', color: 'purple' },
  ];

  public async interface(method: string, client: Socket, payload: unknown) {
    // todo: validate types
    const data = await this.methodsMap[method].call(this, client, payload);
    return {
      method,
      payload: data,
    };
  }

  private createRoom(): { roomId: string } {
    const roomId = uuid();
    // todo: uncommit when ready settings
    // this.storage.client.json.set('gc:room', roomId, settings);
    return { roomId };
  }

  private async joinRoom(
    client: Socket,
    { roomId }: { roomId: string },
  ): Promise<{
    activeUserId: string;
    clients: { id: string; name: string }[];
  }> {
    await client.join(roomId);
    const sockets = (await client.in(roomId).fetchSockets()) as {
      id: string;
    }[];
    const result = {
      method: 'joinRoom',
      payload: {
        clients: sockets.concat([{ id: client.id }]).map(({ id }, index) => ({
          id,
          ...this.names[index],
        })),
        activeUserId: await this.gameService.getActiveUser(roomId),
      },
    };
    client.to(roomId).emit('gc', result);
    return result.payload;
  }

  private async leaveRoom(
    client: Socket,
    { roomId }: { roomId: string },
  ): Promise<void> {
    const sockets = await client.in(roomId).fetchSockets();
    client.to(roomId).emit('gc', {
      method: 'leaveRoom',
      payload: sockets.map(({ id }, index) => ({
        id,
        ...this.names[index],
      })),
    });
    client.leave(roomId);
    this.gameService.clientLeaveGame(roomId, client);
  }
}
