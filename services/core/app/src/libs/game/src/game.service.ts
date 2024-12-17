import { BadRequestException, Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

import { GAME_STATE } from './const/game.const';
import { GameUserChoice } from './interfaces/game.user.interface';

import { GameStateService } from './services/game.state.service';
import { GameUserService } from './services/game.user.service';
import { GameQuestionService } from './services/game.question.service';
import { GamePositionService } from './services/game.position.service';
import { GamePoolService } from './services/game.pool.service';

@Injectable()
export class GameService {
  private sockets: Server = null;
  private readonly methodsMap = {
    startGame: this.startGame,
    selectPosition: this.selectPosition,
    selectChoice: this.selectChoice,
  };

  // fsm transit map
  private readonly transitions = {
    [GAME_STATE.LOBBY]: {
      next: GAME_STATE.PREPARE,
    },
    [GAME_STATE.PREPARE]: {
      next: GAME_STATE.CONTEST,
      fn: (roomId: string) => this.setPositionSettingMode(roomId),
    },
    [GAME_STATE.CONTEST]: {
      fn: (roomId: string) => this.setContestMode(roomId),
    },
    [GAME_STATE.LAND_GRAB]: {
      next: GAME_STATE.CONTEST,
      fn: (roomId: string) => this.setPositionSettingMode(roomId),
    },
    [GAME_STATE.BATTLE]: {
      next: GAME_STATE.CONTEST,
      fn: (roomId: string) => this.setContestMode(roomId),
    },
    [GAME_STATE.FINISH]: {
      next: GAME_STATE.FINISH,
    },
  };

  constructor(
    private gameStateService: GameStateService,
    private gameUserService: GameUserService,
    private gameQuestionService: GameQuestionService,
    private gamePositionService: GamePositionService,
    private readonly gamePoolService: GamePoolService,
  ) {}

  public provideSockets(sockets: Server) {
    this.sockets = sockets;
    this.gameStateService.provideSockets(sockets);
    this.gameUserService.provideSocktes(sockets);
    this.gameQuestionService.provideSockets(sockets);
    this.gamePositionService.provideSockets(sockets);
  }

  public async interface(
    method: keyof typeof this.methodsMap,
    client: Socket,
    payload: unknown,
  ) {
    // todo: validate types
    const data = await this.methodsMap[method].call(this, client, payload);
    return {
      method,
      payload: data,
    };
  }

  public async clientLeaveGame(roomId: string, client: Socket) {
    const activeUser = await this.gameUserService.getActiveUserByIndex(
      roomId,
      0,
    );
    if (activeUser !== client.id) {
      return;
    }
    await this.gamePoolService.removeUser(roomId, client.id);
    this.gameUserService.setActiveUser(
      roomId,
      await this.gameUserService.popActiveUser(roomId),
    );
  }

  public async clientJoinGame(roomId: string, userId: string) {
    const [_, activeUser] = await Promise.all([
      this.gamePoolService.addUser(roomId, userId),
      this.gameUserService.getActiveUserByIndex(roomId, 0),
    ]);
    if (!activeUser) {
      await this.gameUserService.setActiveUser(roomId, userId);
    }
  }

  public setStatus(roomId: string, status: GAME_STATE): void {
    this.gameStateService.setState(roomId, status);
  }

  public async getStatus(roomId: string): Promise<GAME_STATE> {
    return this.gameStateService.getState(roomId);
  }

  /**
   * Game-tick after every game event, call next transition if is posible
   * @param roomId
   * @returns
   */
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

  /**
   * Set mode when users choose lands and set positions
   * @param roomId
   * @returns
   */
  private async setPositionSettingMode(roomId: string): Promise<void> {
    const userId = await this.gameUserService.popActiveUser(roomId);
    if (userId) {
      this.gameUserService.setActiveUser(roomId, userId);
      return;
    }
    const gameState = (await this.getStatus(roomId)) as
      | GAME_STATE.PREPARE
      | GAME_STATE.LAND_GRAB;
    this.setStatus(roomId, this.transitions[gameState].next);
    this.gameUserService.addActiveUsersQueue(
      roomId,
      await this.gamePoolService.getUsers(roomId),
    );
    this.nextTick(roomId);
  }

  /**
   * Contest mode
   * @param roomId
   */
  private async setContestMode(roomId: string): Promise<void> {
    await this.gameQuestionService.sendQuestion(
      roomId,
      await this.gameUserService.getAllActiveUsers(roomId),
    );
  }

  /**
   * First point of game
   * @param client
   * @param param1
   * @returns
   */
  private async startGame(client: Socket, { roomId }: { roomId: string }) {
    const users = await this.gamePoolService.getUsers(roomId);
    if (users.length < 2) {
      // todo: add error-system
      throw new BadRequestException({
        message: 'Error',
      });
    }
    client.to(roomId).emit('game', {
      method: 'startGame',
      payload: { roomId },
    });
    this.setStatus(roomId, GAME_STATE.PREPARE);
    this.gameUserService.addActiveUsersQueue(roomId, users);
    this.nextTick(roomId);
    return { roomId, gameState: GAME_STATE.PREPARE };
  }

  private async selectPosition(
    client: Socket,
    { roomId, position }: { roomId: string; position: string },
  ) {
    const positionInfo = await this.gamePositionService.getPosition(
      roomId,
      position,
    );
    if (!positionInfo) {
      const state = await this.gameStateService.getState(roomId);
      // first position is capital
      const isCapital = state === GAME_STATE.PREPARE;
      this.gamePositionService.setPosition(roomId, position, {
        userId: client.id,
        isCapital,
        health: isCapital ? 3 : 1,
      });
      this.nextTick(roomId);
      return;
    }

    await this.gameUserService.cleanActiveUsers(roomId);
    await Promise.all([
      this.gameUserService.addActiveUsersQueue(roomId, [
        positionInfo.userId,
        client.id,
      ]),
      this.gamePositionService.setDisput(roomId, position, {
        userId: positionInfo.userId,
        rivaluserId: client.id,
      }),
    ]);

    this.setStatus(roomId, GAME_STATE.BATTLE);
    this.nextTick(roomId);
  }

  private async selectChoice(
    client: Socket,
    {
      roomId,
      choice,
      responseRate,
    }: { roomId: string; choice: string; responseRate: number },
  ) {
    await Promise.all([
      this.gameUserService.commitChoice(roomId, client.id, {
        choice,
        responseRate,
      }),
      this.gameUserService.popActiveUser(roomId),
    ]);
    const stack = await this.gameUserService.getLenActiveUsers(roomId);
    if (!stack) {
      const users = await this.finishContest(roomId);
      await this.gameUserService.addActiveUsersQueue(roomId, users);
      this.nextTick(roomId, 1000);
      return;
    }
  }

  private async finishContest(roomId: string): Promise<string[]> {
    const [status, answer, usersAnswers] = await Promise.all([
      this.getStatus(roomId),
      this.gameQuestionService.getAnswerQuestion(roomId),
      this.gameUserService.popChoices(roomId),
    ]);

    const usersWhoRights = Object.keys(usersAnswers).filter(
      (userId) => answer === usersAnswers[userId].choice,
    );

    this.emitFinishContest(roomId, answer, usersAnswers);

    // todo: refactor!
    if (status === GAME_STATE.BATTLE) {
      return this.battle(roomId, usersWhoRights);
    }

    if (usersWhoRights.length) {
      this.setStatus(roomId, GAME_STATE.LAND_GRAB);
      return usersWhoRights;
    }

    return this.gamePoolService.getUsers(roomId);
  }

  private async battle(
    roomId: string,
    usersWhoRights: string[],
  ): Promise<string[]> {
    const disput = await this.gamePositionService.getDisput(roomId);
    const position = await this.gamePositionService.getPosition(
      roomId,
      disput.position,
    );
    const { rivaluserId, userId } = disput.users;

    // if users who rights is not 1, continue battle in next tick
    if (usersWhoRights.length !== 1) {
      return [rivaluserId, userId];
    }
    const allUsers = await this.gamePoolService.getUsers(roomId);
    const [winnerUserId] = usersWhoRights;
    // if user which win is current owner, battle is finish
    if (winnerUserId === position.userId) {
      this.setStatus(roomId, GAME_STATE.LAND_GRAB);
      return allUsers;
    }
    // if position have health points, decrease them and continue battle in next tick
    if (position.health > 1) {
      await this.gamePositionService.setPosition(roomId, disput.position, {
        ...position,
        health: position.health - 1,
      });
      return [rivaluserId, userId];
    }
    // else remove losing user from active pool, grab their territory and next tick in status
    // todo: finish game
    if (allUsers.length === 2) {
      this.setStatus(roomId, GAME_STATE.FINISH);
      return [winnerUserId];
    }

    this.setStatus(roomId, GAME_STATE.LAND_GRAB);
    Promise.all([
      this.gamePositionService.setPosition(roomId, disput.position, {
        userId: winnerUserId,
      }),
      this.gamePoolService.removeUser(roomId, userId),
    ]);

    return allUsers.filter((id) => id !== userId);
  }

  private emitFinishContest(
    roomId: string,
    answer: string,
    usersAnswers: Record<string, GameUserChoice>,
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
      this.tick(roomId);
    }, timeout);
  }
}
