import { Module } from '@nestjs/common';
import { CoordinatorService } from './coordinator.service';
import { CoordinatorGateway } from './coordinator.gateway';
import { CoordinatorController } from './coordinator/coordinator.controller';

@Module({
  providers: [CoordinatorService, CoordinatorGateway],
  exports: [CoordinatorService],
  controllers: [CoordinatorController],
})
export class CoordinatorModule {}
