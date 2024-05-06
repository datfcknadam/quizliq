import { Server } from 'socket.io';
import { EventService } from 'src/libs/event/src';
import { GAME_STATUS } from './game.const';
import { Injectable } from '@nestjs/common';

@Injectable()
export class StateService {
  // todo: Bad practice - refactor this
  private sockets: Server = null;

  constructor(private eventService: EventService) {}

  public provideSockets(sockets: Server) {
    this.sockets = sockets;
  }

  public setState(roomId: string, status: GAME_STATUS) {
    this.eventService.client.set(`fsm:${roomId}:state`, status);
  }

  public async getState(roomId: string): Promise<number> {
    return Number(await this.eventService.client.get(`fsm:${roomId}:state`));
  }
}
