import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { StorageService } from 'src/libs/storage/src';
import { Socket } from 'socket.io';

@Injectable()
export class CoordinatorService {
  methodsMap = {
    createRoom: this.createRoom,
    leaveRoom: this.leaveRoom,
    joinRoom: this.joinRoom,
  };

  constructor(private storage: StorageService) {}

  public interface(method: string, client: Socket, payload: unknown) {
    // todo: validate types
    return this.methodsMap[method](client, payload);
  }

  private createRoom(client: Socket): string {
    const roomId = uuid();
    client.join(roomId);
    // todo: uncommit when ready settings
    // this.storage.client.json.set('gc:room', roomId, settings);
    return roomId;
  }

  private joinRoom(client: Socket, { roomId }: { roomId: string }): true {
    client.join(roomId);
    client
      .to(roomId)
      .emit('gc', { method: 'joinRoom', payload: { clientId: client.id } });
    return true;
  }

  private leaveRoom(client: Socket, { roomId }: { roomId: string }): void {
    client.leave(roomId);
    client
      .to(roomId)
      .emit('gc', { method: 'leaveRoom', payload: { clientId: client.id } });
  }
}
