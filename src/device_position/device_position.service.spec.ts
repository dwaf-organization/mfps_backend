import { Test, TestingModule } from '@nestjs/testing';
import { DevicePositionService } from './device_position.service';

describe('DevicePositionService', () => {
  let service: DevicePositionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DevicePositionService],
    }).compile();

    service = module.get<DevicePositionService>(DevicePositionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
