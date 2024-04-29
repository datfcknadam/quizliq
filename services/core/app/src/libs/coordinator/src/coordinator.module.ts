import { Module } from '@nestjs/common';
import { CoordinatorService } from './coordinator.service';
import { CoordinatorGateway } from './coordinator.gateway';
import { GameService } from 'src/libs/game/src';

@Module({
  providers: [CoordinatorService, CoordinatorGateway, GameService],
  exports: [CoordinatorService],
})
export class CoordinatorModule {}
