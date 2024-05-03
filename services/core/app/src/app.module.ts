import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CoordinatorModule } from './libs/coordinator/src';
import { EventModule } from './libs/event/src';
import { ContentModule } from './libs/content/src';

import adminConfig from './configs/admin.config';

@Module({
  imports: [EventModule, CoordinatorModule, ContentModule.forRoot(adminConfig)],
  controllers: [AppController],
  providers: [AppService],
  exports: [EventModule],
})
export class AppModule {}
