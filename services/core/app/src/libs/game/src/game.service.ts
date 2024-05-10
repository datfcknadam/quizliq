import { Injectable, OnModuleInit } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

import { EventService } from 'src/libs/event/src';
import { GAME_STATE } from './const/game.const';

import { GameStateService } from './services/game.state.service';
import { GameUserService } from './services/game.user.service';
import { GameQuestionService } from './services/game.question.service';
import { GamePositionService } from './services/game.position.service';

@Injectable()
export class GameService implements OnModuleInit {
  private sockets: Server = null;
  private readonly methodsMap = {
    startGame: this.startGame,
    selectPosition: this.selectPosition,
    selectChoice: this.selectChoice,
  };

  private readonly transitions = {
    [GAME_STATE.LOBBY]: {
      next: GAME_STATE.PREPARE,
    },
    [GAME_STATE.PREPARE]: {
      next: GAME_STATE.CONTEST,
      fn: (roomId: string) => this.positionSetting(roomId),
    },
    [GAME_STATE.CONTEST]: {
      fn: (roomId: string) => this.contest(roomId),
    },
    [GAME_STATE.LAND_GRAB]: {
      next: GAME_STATE.CONTEST,
      fn: (roomId: string) => this.positionSetting(roomId),
    },
    [GAME_STATE.BATTLE]: {
      next: GAME_STATE.CONTEST,
      fn: (roomId: string) => this.contest(roomId),
    },
    [GAME_STATE.FINISH]: {
      next: GAME_STATE.FINISH,
    },
  };

  constructor(
    private eventService: EventService,
    private gameStateService: GameStateService,
    private gameUserService: GameUserService,
    private gameQuestionService: GameQuestionService,
    private gamePositionService: GamePositionService,
  ) {}

  public provideSockets(sockets: Server) {
    this.sockets = sockets;
    this.gameStateService.provideSockets(sockets);
    this.gameUserService.provideSocktes(sockets);
    this.gameQuestionService.provideSockets(sockets);
    this.gamePositionService.provideSockets(sockets);
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
      await this.gameUserService.setActiveUser(roomId, clientId);
    }
  }

  public setStatus(roomId: string, status: GAME_STATE): void {
    this.gameStateService.setState(roomId, status);
  }

  public async getStatus(roomId: string): Promise<GAME_STATE> {
    return this.gameStateService.getState(roomId);
  }

  private async tick(roomId: string): Promise<void> {
    const state = await this.gameStateService.getState(roomId);
    const transition = this.transitions[state];
    if (!transition) {
      return;
    }
    if (typeof transition.fn === 'function') {
      await transition.fn.call(this, roomId);
    }
  }

  private async positionSetting(roomId: string): Promise<void> {
    const clientId = await this.gameUserService.popStack(roomId);
    if (clientId) {
      this.gameUserService.setActiveUser(roomId, clientId);
      return;
    }
    const gameState = (await this.getStatus(roomId)) as
      | GAME_STATE.PREPARE
      | GAME_STATE.LAND_GRAB;
    this.setStatus(roomId, this.transitions[gameState].next);
    this.gameUserService.addUsersToStack(
      roomId,
      this.gameUserService.getClientsInRoom(roomId),
    );
    this.nextTick(roomId);
  }

  private async contest(roomId: string): Promise<void> {
    await this.gameQuestionService.sendQuestion(roomId);
  }

  private startGame(client: Socket, { roomId }: { roomId: string }) {
    client.to(roomId).emit('game', {
      method: 'startGame',
      payload: { roomId },
    });
    this.setStatus(roomId, GAME_STATE.PREPARE);
    this.gameUserService.addUsersToStack(
      roomId,
      this.gameUserService.getClientsInRoom(roomId),
    );
    this.nextTick(roomId);
    return { roomId, gameState: GAME_STATE.PREPARE };
  }

  private async selectPosition(
    client: Socket,
    { roomId, position }: { roomId: string; position: string },
  ) {
    const existClient = await this.gamePositionService.getClientByPosition(
      roomId,
      position,
    );
    if (!existClient) {
      this.gamePositionService.setPosition(roomId, position, {
        clientId: client.id,
      });
      this.nextTick(roomId);
      return;
    }
    this.gamePositionService.setPosition(roomId, position, {
      clientId: existClient,
      rivalClientId: client.id,
    });
    await this.gameUserService.cleanUserStack(roomId);
    await this.gameUserService.addUsersToStack(roomId, [
      existClient,
      client.id,
    ]);
    this.gamePositionService.setDisputedArea(roomId, position);
    this.setStatus(roomId, GAME_STATE.BATTLE);
    this.nextTick(roomId);
  }

  private async selectChoice(
    client: Socket,
    {
      roomId,
      choice,
      responseTime,
    }: { roomId: string; choice: string; responseTime: number },
  ) {
    await this.gameUserService.commitChoice(roomId, client.id, {
      choice,
      responseTime,
    });
    await this.gameUserService.popStack(roomId);
    const stack = await this.gameUserService.getLenUsersStack(roomId);
    if (!stack) {
      await this.finishContest(roomId);
      this.nextTick(roomId, 1000);
      return;
    }
  }

  private async finishContest(roomId: string) {
    const status = await this.getStatus(roomId);
    const answer = await this.gameQuestionService.getAnswerQuestion(roomId);
    const usersAnswers = await this.gameUserService.getChoices(roomId);
    const allUsers = this.gameUserService.getClientsInRoom(roomId);
    const usersWhoRights = Object.entries(usersAnswers)
      .map(([clientId, clientAnswer]) => answer === clientAnswer && clientId)
      .filter(Boolean);

    this.emitFinishContest(roomId, answer, usersAnswers);

    // todo: refactor!
    if (status === GAME_STATE.BATTLE) {
      if (usersWhoRights.length === 1) {
        this.setStatus(roomId, GAME_STATE.LAND_GRAB);
        this.gamePositionService.setPosition(
          roomId,
          await this.gamePositionService.getDisputedArea(roomId),
          { clientId: usersWhoRights[0] },
        );
      }
      await this.gameUserService.addUsersToStack(roomId, allUsers);
      return;
    }

    if (usersWhoRights.length) {
      await this.gameUserService.addUsersToStack(roomId, usersWhoRights);
      this.setStatus(roomId, GAME_STATE.LAND_GRAB);
      return;
    }
    await this.gameUserService.addUsersToStack(roomId, allUsers);
  }

  private emitFinishContest(
    roomId: string,
    answer: string,
    usersAnswers: Record<string, string>,
  ) {
    this.sockets.to(roomId).emit('game', {
      method: 'finishContest',
      payload: {
        answer,
        usersAnswers,
      },
    });
  }

  private nextTick(roomId: string, timeout = 0) {
    setTimeout(() => {
      this.eventService.pub.publish('game:tick', Buffer.from(roomId));
    }, timeout);
  }
}
