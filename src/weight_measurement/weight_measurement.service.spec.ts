import { Test, TestingModule } from '@nestjs/testing';
import { WeightMeasurementService } from './weight_measurement.service';

describe('WeightMeasurementService', () => {
  let service: WeightMeasurementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WeightMeasurementService],
    }).compile();

    service = module.get<WeightMeasurementService>(WeightMeasurementService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
