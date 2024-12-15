import { Module } from '@nestjs/common';
import { CoordinatorService } from './coordinator.service';
import { CoordinatorGateway } from './coordinator.gateway';
import GameModule from 'src/libs/game/src/game.module';

@Module({
  providers: [CoordinatorService, CoordinatorGateway],
  exports: [CoordinatorService],
  imports: [GameModule],
})
// Game coordinator module
export class CoordinatorModule {}
