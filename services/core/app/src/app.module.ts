import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CoordinatorModule } from './libs/coordinator/src';
import { EventModule } from './libs/event/src';

@Module({
  imports: [EventModule, CoordinatorModule],
  controllers: [AppController],
  providers: [AppService],
  exports: [EventModule],
})
export class AppModule {}
