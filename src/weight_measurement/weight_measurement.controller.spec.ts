import { Test, TestingModule } from '@nestjs/testing';
import { WeightMeasurementController } from './weight_measurement.controller';

describe('WeightMeasurementController', () => {
  let controller: WeightMeasurementController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WeightMeasurementController],
    }).compile();

    controller = module.get<WeightMeasurementController>(WeightMeasurementController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
