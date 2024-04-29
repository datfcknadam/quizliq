import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  RedisClientType,
  RedisDefaultModules,
  RedisFunctions,
  RedisScripts,
  createClient,
} from 'redis';

@Injectable()
export class EventService implements OnModuleInit {
  pub: RedisClientType<RedisDefaultModules, RedisFunctions, RedisScripts>;
  sub: RedisClientType<RedisDefaultModules, RedisFunctions, RedisScripts>;
  client: RedisClientType<RedisDefaultModules, RedisFunctions, RedisScripts>;

  onModuleInit() {
    const client = createClient({ url: 'redis://redis:6379' });
    this.client = client;
    this.pub = client.duplicate();
    this.sub = client.duplicate();
    Promise.all([
      this.pub.connect(),
      this.sub.connect(),
      this.client.connect(),
    ]);
  }
}
