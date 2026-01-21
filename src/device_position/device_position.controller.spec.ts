import { Test, TestingModule } from '@nestjs/testing';
import { DevicePositionController } from './device_position.controller';

describe('DevicePositionController', () => {
  let controller: DevicePositionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DevicePositionController],
    }).compile();

    controller = module.get<DevicePositionController>(DevicePositionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
