import { Server } from 'socket.io';
import { EventService } from 'src/libs/event/src';
import { GAME_STATE } from '../const/game.const';
import { Injectable } from '@nestjs/common';

@Injectable()
export class GameStateService {
  // todo: Bad practice - refactor this
  private sockets: Server = null;

  constructor(private eventService: EventService) {}

  public provideSockets(sockets: Server) {
    this.sockets = sockets;
  }

  public setState(roomId: string, status: GAME_STATE) {
    this.eventService.client.set(`game:${roomId}:state`, status);
    this.sockets.to(roomId).emit('game', {
      method: 'setState',
      payload: status,
    });
  }

  public async getState(roomId: string): Promise<number> {
    return Number(await this.eventService.client.get(`game:${roomId}:state`));
  }
}
