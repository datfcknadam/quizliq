import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CoordinatorModule } from './libs/coordinator/src';
import { StorageModule } from './libs/storage/src';

@Module({
  imports: [StorageModule, CoordinatorModule],
  controllers: [AppController],
  providers: [AppService],
  exports: [StorageModule],
})
export class AppModule {}
