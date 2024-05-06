import { Injectable, OnModuleInit } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { EventService } from 'src/libs/event/src';
import { GAME_STATUS } from './game.const';
import { StateService } from './fsm.service';
import { GameUserService } from './game.user.service';
import { GameQuestionService } from './game.question.service';

@Injectable()
export class GameService implements OnModuleInit {
  private sockets: Server = null;
  private readonly methodsMap = {
    startGame: this.startGame,
    selectPosition: this.selectPosition,
    selectChoice: this.selectChoice,
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
      next: GAME_STATUS.CONTEST,
    },
    [GAME_STATUS.FINISH]: {
      next: GAME_STATUS.FINISH,
    },
  };

  constructor(
    private eventService: EventService,
    private fsmService: StateService,
    private gameUserService: GameUserService,
    private gameQuestionService: GameQuestionService,
  ) {}

  public provideSockets(sockets: Server) {
    this.sockets = sockets;
    this.fsmService.provideSockets(sockets);
    this.gameUserService.provideSocktes(sockets);
    this.gameQuestionService.provideSockets(sockets);
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

  public async interface(method: string, client: Socket, payload: unknown) {
    // todo: validate types
    const data = await this.methodsMap[method].call(this, client, payload);
    return {
      method,
      payload: data,
    };
  }

  public async clientLeaveGame(roomId: string, client: Socket) {
    const activeUser = await this.gameUserService.getUserStackByIndex(
      roomId,
      0,
    );
    if (activeUser !== client.id) {
      return;
    }
    await this.gameUserService.removeUserStack(roomId, client.id);
    this.gameUserService.setActiveUser(
      roomId,
      await this.gameUserService.popStack(roomId),
    );
  }

  public async clientJoinGame(roomId: string, clientId: string) {
    const activeUser = await this.gameUserService.getUserStackByIndex(
      roomId,
      0,
    );
    if (!activeUser) {
      this.gameUserService.setActiveUser(roomId, clientId);
    }
  }

  public setStatus(roomId: string, status: GAME_STATUS): void {
    this.fsmService.setState(roomId, status);
    this.sockets.to(roomId).emit('game', {
      method: 'setState',
      payload: status,
    });
  }

  public async getStatus(roomId: string): Promise<GAME_STATUS> {
    return this.fsmService.getState(roomId);
  }

  private async tick(roomId: string) {
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
    const clientId = await this.gameUserService.popStack(roomId);
    if (!clientId) {
      this.setStatus(roomId, this.transitions[GAME_STATUS.PREPARE].next);
      this.gameUserService.addUsersToStack(
        roomId,
        this.gameUserService.getClientsInRoom(roomId),
      );
      this.nextTick(roomId);
      return;
    }
    this.gameUserService.setActiveUser(roomId, clientId);
  }

  private async contest(roomId: string) {
    await this.gameQuestionService.sendQuestion(roomId);
  }

  private startGame(client: Socket, { roomId }: { roomId: string }) {
    client.to(roomId).emit('game', {
      method: 'startGame',
      payload: { roomId },
    });
    this.setStatus(roomId, GAME_STATUS.PREPARE);
    this.gameUserService.addUsersToStack(
      roomId,
      this.gameUserService.getClientsInRoom(roomId),
    );
    this.nextTick(roomId);
    return { roomId, gameStatus: GAME_STATUS.PREPARE };
  }

  private async selectPosition(
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

  private async selectChoice(
    client: Socket,
    { roomId, choice }: { roomId: string; choice: string },
  ) {
    await this.gameUserService.commitChoice(roomId, client.id, choice);
    const stack = await this.gameUserService.getLenUsersStack(roomId);
    if (!stack) {
      await this.finishContest(roomId);
      return;
    }
  }

  private async finishContest(roomId: string) {
    this.setStatus(roomId, this.transitions[GAME_STATUS.CONTEST].next);
    this.sockets.to(roomId).emit('game', {
      method: 'finishContest',
      payload: {
        answer: await this.gameQuestionService.getAnswerQuestion(roomId),
        usersAnswers: await this.gameUserService.getChoices(roomId),
      },
    });
  }

  private nextTick(roomId: string) {
    this.eventService.pub.publish('game:tick', Buffer.from(roomId));
  }
}
