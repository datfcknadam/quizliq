import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { EventService } from 'src/libs/event/src';
import { Position } from '../interfaces/game.position.interface';

@Injectable()
export class GamePositionService {
  private sockets: Server;

  constructor(private readonly eventService: EventService) {}

  public provideSockets(sockets: Server) {
    this.sockets = sockets;
  }

  public async getPosition(
    roomId: string,
    positionId: string,
  ): Promise<Position> {
    const position = await this.eventService.client.hGet(
      `game:${roomId}:position`,
      positionId,
    );
    return JSON.parse(position);
  }

  public async setPosition(
    roomId: string,
    position: string,
    { userId, isCapital, health }: Position,
  ) {
    const data = {
      userId,
      isCapital: isCapital || false,
      health: health || 1,
    };
    await this.eventService.client.hSet(
      `game:${roomId}:position`,
      position,
      JSON.stringify(data),
    );
    this.sockets.to(roomId).emit('game', {
      method: 'selectPosition',
      payload: { position, ...data },
    });
  }

  public async setDisput(
    roomId: string,
    position: string,
    { userId, rivaluserId }: { userId: string; rivaluserId: string },
  ): Promise<void> {
    await this.eventService.client.hSet(`game:${roomId}:disput`, {
      position,
      users: JSON.stringify({
        userId,
        rivaluserId,
      }),
    });
    this.sockets.to(roomId).emit('game', {
      method: 'setDisput',
      payload: { position, userId, rivaluserId },
    });
  }

  public async getDisput(roomId: string): Promise<{
    users: { userId: string; rivaluserId: string };
    position: string;
  }> {
    const { users, position } = await this.eventService.client.hGetAll(
      `game:${roomId}:disput`,
    );
    return {
      users: JSON.parse(users),
      position,
    };
  }
}
