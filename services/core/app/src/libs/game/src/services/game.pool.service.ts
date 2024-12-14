import { Injectable } from '@nestjs/common';
import { EventService } from 'src/libs/event/src';

@Injectable()
export class GamePoolService {
  constructor(private readonly eventService: EventService) {}

  public async addUser(roomId: string, userId: string) {
    await this.eventService.client.sAdd(`game:${roomId}:pool`, userId);
  }

  public async removeUser(roomId: string, userId: string) {
    await this.eventService.client.sRem(`game:${roomId}:pool`, userId);
  }

  public async getUsers(roomId: string): Promise<string[]> {
    return await this.eventService.client.sMembers(`game:${roomId}:pool`);
  }
}
