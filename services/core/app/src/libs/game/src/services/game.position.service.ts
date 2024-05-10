import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { EventService } from 'src/libs/event/src';

@Injectable()
export class GamePositionService {
  private sockets: Server;

  constructor(private readonly eventService: EventService) {}

  public provideSockets(sockets: Server) {
    this.sockets = sockets;
  }

  public getClientByPosition(
    roomId: string,
    position: string,
  ): Promise<string> {
    return this.eventService.client.get(`game:${roomId}:${position}`);
  }

  public setPosition(
    roomId: string,
    position: string,
    { clientId, rivalClientId }: { clientId: string; rivalClientId?: string },
  ) {
    this.eventService.client.set(`game:${roomId}:${position}`, clientId);
    this.sockets.to(roomId).emit('game', {
      method: 'selectPosition',
      payload: { position, clientId, rivalClientId },
    });
  }

  public async setDisputedArea(
    roomId: string,
    position: string,
  ): Promise<void> {
    await this.eventService.client.set(`game:${roomId}:disputedArea`, position);
  }

  public async getDisputedArea(roomId: string): Promise<string> {
    return this.eventService.client.get(`game:${roomId}:disputedArea`);
  }
}
