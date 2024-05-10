import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { ContentService } from 'src/libs/content/src';
import { EventService } from 'src/libs/event/src';

@Injectable()
export class GameQuestionService {
  private sockets: Server;
  constructor(
    private readonly contentService: ContentService,
    private readonly eventService: EventService,
  ) {}

  async provideSockets(sockets: Server) {
    this.sockets = sockets;
  }

  async sendQuestion(roomId: string) {
    const data = await this.contentService.getRandom();
    this.commitAnswerQuestion(roomId, data.correct);
    delete data.correct;

    this.sockets.to(roomId).emit('game', {
      method: 'sendQuestion',
      payload: { question: data, options: { time: 30000 } },
    });
  }

  commitAnswerQuestion(roomId: string, answer: string) {
    this.eventService.client.set(`question:${roomId}:answer`, String(answer));
  }

  async getAnswerQuestion(roomId: string) {
    return this.eventService.client.get(`question:${roomId}:answer`);
  }
}
