import { Test, TestingModule } from '@nestjs/testing';
import { CoordinatorGateway } from './coordinator.gateway';

describe('CoordinatorGateway', () => {
  let gateway: CoordinatorGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CoordinatorGateway],
    }).compile();

    gateway = module.get<CoordinatorGateway>(CoordinatorGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
