import { Injectable, OnModuleInit } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { EventService } from 'src/libs/event/src';
import { GAME_STATUS } from './game.const';
import StateService from './fsm.service';
import GameUserService from './game.user.service';

@Injectable()
export class GameService implements OnModuleInit {
  private sockets: Server = null;
  private readonly methodsMap = {
    startGame: this.startGame,
    selectPosition: this.selectPosition,
  };

  private transitions = {
    [GAME_STATUS.LOBBY]: {
      next: GAME_STATUS.PREPARE,
    },
    [GAME_STATUS.PREPARE]: {
      next: GAME_STATUS.CONTEST,
      fn: (roomId: string) => this.prepare(roomId),
    },
    [GAME_STATUS.CONTEST]: {
      next: GAME_STATUS.BATTLE,
      fn: (roomId: string) => this.contest(roomId),
    },
    [GAME_STATUS.BATTLE]: {
      next: GAME_STATUS.FINISH,
    },
    [GAME_STATUS.FINISH]: {
      next: GAME_STATUS.FINISH,
    },
  };

  constructor(
    private eventService: EventService,
    private fsmService: StateService,
    private gameUserService: GameUserService,
  ) {}

  public provideSockets(sockets: Server) {
    this.sockets = sockets;
    this.fsmService.provideSockets(sockets);
    this.gameUserService.provideSocktes(sockets);
  }

  public onModuleInit() {
    this.eventService.sub.subscribe(
      'game:tick',
      async (message) => {
        const roomId = message.toString();
        await this.tick(roomId);
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
    const activeUser = await this.gameUserService.getActiveUser(roomId);
    if (activeUser !== client.id) {
      return;
    }
    this.gameUserService.nextActiveUser(roomId);
  }

  public async clientJoinGame(roomId: string, clientId: string) {
    const activeUser = await this.gameUserService.getActiveUser(roomId);
    if (!activeUser) {
      this.gameUserService.setActiveUser(roomId, clientId);
    }
  }

  public getActiveUser(roomId: string): Promise<string> {
    return this.gameUserService.getActiveUser(roomId);
  }

  public setStatus(roomId: string, status: GAME_STATUS): void {
    this.fsmService.setState(roomId, status);
  }

  public async getStatus(roomId: string): Promise<GAME_STATUS> {
    return this.fsmService.getState(roomId);
  }

  private async tick(roomId) {
    const state = await this.fsmService.getState(roomId);
    const transition = this.transitions[state];
    if (!transition) {
      return;
    }
    if (typeof transition.fn === 'function') {
      await transition.fn.call(this, roomId);
    }
  }

  private async prepare(roomId: string) {
    const steps = await this.eventService.client.incr(`game:${roomId}:step`);
    const sockets = this.gameUserService.getSocketsInRoom(roomId);
    if (steps >= sockets.size) {
      this.setStatus(roomId, this.transitions[GAME_STATUS.PREPARE].next);
    }
    this.gameUserService.nextActiveUser(roomId);
  }

  private async contest(roomId: string) {
    console.log('contest', roomId);
  }

  private startGame(client: Socket, { roomId }: { roomId: string }) {
    client.to(roomId).emit('game', {
      method: 'startGame',
      payload: { roomId, gameStatus: GAME_STATUS.PREPARE },
    });
    this.setStatus(roomId, GAME_STATUS.PREPARE);
    this.nextTick(roomId);
    return { roomId, gameStatus: GAME_STATUS.PREPARE };
  }

  private nextTick(roomId: string) {
    this.eventService.pub.publish('game:tick', Buffer.from(roomId));
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
    this.nextTick(roomId);
    return { position, clientId: client.id };
  }
}
