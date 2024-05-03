import { DynamicModule, Module } from '@nestjs/common';
import { API_TOKEN, API_URL } from './const/content.tokens';
import { ContentService } from './content.service';

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
          useValue: config.url,
        },
        ContentService,
      ],
      exports: [ContentService],
    };
  }
}
