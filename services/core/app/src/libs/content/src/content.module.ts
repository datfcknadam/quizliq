import { DynamicModule, Global, Module } from '@nestjs/common';
import { API_TOKEN, API_URL } from './const/content.tokens';
import { ContentService } from './content.service';

@Global()
@Module({})
export class ContentModule {
  static forRoot(config: { token: string; url: string }): DynamicModule {
    return {
      module: ContentModule,
      providers: [
        {
          provide: API_TOKEN,
          useValue: config.token,
        },
        {
          provide: API_URL,
          useValue: new URL(config.url),
        },
        ContentService,
      ],
      exports: [ContentService],
    };
  }
}
