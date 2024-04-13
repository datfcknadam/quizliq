import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { CoordinatorService } from './coordinator.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class CoordinatorGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private gcService: CoordinatorService) {}

  @WebSocketServer()
  server: Server;

  @SubscribeMessage('gc')
  createRoom(
    @MessageBody() data: { method: string; payload: unknown },
    @ConnectedSocket() client: Socket,
  ): WsResponse<unknown> {
    console.log(data);
    return {
      event: 'gc',
      data: this.gcService.interface(data.method, client, data.payload),
    };
  }

  @SubscribeMessage('identity')
  async identity(@MessageBody() data: number): Promise<number> {
    return data;
  }

  handleDisconnect(client: Socket) {
    console.log(`Disconnected: ${client.id}`);
  }

  handleConnection(client: Socket, ...args: any[]) {
    console.log(`Connected ${client.id}`);
  }
}
