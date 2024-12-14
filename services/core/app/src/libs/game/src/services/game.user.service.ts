import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { EventService } from 'src/libs/event/src';
import { GameUserChoice } from '../interfaces/game.user.interface';
import { GamePoolService } from './game.pool.service';

@Injectable()
export class GameUserService {
  private sockets: Server = null;

  constructor(private readonly eventService: EventService) {}

  public provideSocktes(sockets: Server) {
    this.sockets = sockets;
  }

  public async setActiveUser(roomId: string, userId: string) {
    this.sockets.to(roomId).emit('game', {
      method: 'setActiveUser',
      payload: { userId },
    });
  }

  public async addActiveUsersQueue(roomId: string, users: string[]) {
    await this.eventService.client.rPush(`game:${roomId}:stack`, users);
  }

  public async getLenActiveUsers(roomId: string) {
    return this.eventService.client.lLen(`game:${roomId}:stack`);
  }

  public async popActiveUser(roomId: string): Promise<string> {
    return this.eventService.client.lPop(`game:${roomId}:stack`);
  }

  public async getAllActiveUsers(roomId: string): Promise<string[]> {
    const users = await this.eventService.client.lRange(
      `game:${roomId}:stack`,
      0,
      -1,
    );
    return users;
  }

  public async cleanActiveUsers(roomId: string) {
    return this.eventService.client.del(`game:${roomId}:stack`);
  }

  public async getActiveUserByIndex(roomId: string, index: number) {
    return this.eventService.client.lIndex(`game:${roomId}:stack`, index);
  }

  public async commitChoice(
    roomId: string,
    userId: string,
    data: GameUserChoice,
  ) {
    await this.eventService.client.hSet(
      `game:${roomId}:choice`,
      userId,
      JSON.stringify({
        choice: String(data.choice),
        responseRate: data.responseRate,
      }),
    );
  }

  public async popChoices(
    roomId: string,
  ): Promise<Record<string, GameUserChoice>> {
    const data = await this.eventService.client.hGetAll(
      `game:${roomId}:choice`,
    );
    await this.eventService.client.del(`game:${roomId}:choice`);
    return Object.fromEntries(
      Object.entries(data).map(([key, data]) => [key, JSON.parse(data)]),
    );
  }
}
