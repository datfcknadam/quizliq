import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { CoordinatorService } from './coordinator.service';
import { GameService } from 'src/libs/game/src';
import { OnModuleInit } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class CoordinatorGateway implements OnModuleInit, OnGatewayConnection {
  constructor(
    private gcService: CoordinatorService,
    private gameService: GameService,
  ) {}

  @WebSocketServer()
  private readonly server: Server;

  @SubscribeMessage('gc')
  async gcEvents(
    @MessageBody() data: { method: string; payload: unknown },
    @ConnectedSocket() client: Socket,
  ): Promise<WsResponse<unknown>> {
    return {
      event: 'gc',
      data: await this.gcService.interface(data.method, client, data.payload),
    };
  }

  @SubscribeMessage('game')
  async gameEvents(
    @MessageBody() data: { method: string; payload: unknown },
    @ConnectedSocket() client: Socket,
  ): Promise<WsResponse<unknown>> {
    return {
      event: 'game',
      data: await this.gameService.interface(data.method, client, data.payload),
    };
  }

  @SubscribeMessage('identity')
  async identity(@MessageBody() data: number): Promise<number> {
    return data;
  }

  async handleConnection(client: Socket) {
    client.on('disconnecting', async () =>
      Promise.all(
        [...client.rooms.values()].map(async (roomId) =>
          this.gcService.interface('leaveRoom', client, { roomId }),
        ),
      ),
    );
  }

  onModuleInit() {
    this.gameService.provideSockets(this.server);
  }
}
