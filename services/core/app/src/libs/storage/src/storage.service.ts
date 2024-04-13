import { Injectable, OnModuleInit } from '@nestjs/common';
import { RedisClientType, createClient } from 'redis';

@Injectable()
export class StorageService implements OnModuleInit {
  client: RedisClientType;
  async onModuleInit() {
    const client = createClient({ url: 'redis://redis:6379' });
    await client.connect();
  }
}
