import { Test, TestingModule } from '@nestjs/testing';
import { DeviceStateController } from './device_state.controller';

describe('DeviceStateController', () => {
  let controller: DeviceStateController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeviceStateController],
    }).compile();

    controller = module.get<DeviceStateController>(DeviceStateController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
