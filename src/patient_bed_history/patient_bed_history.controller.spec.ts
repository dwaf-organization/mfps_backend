import { Test, TestingModule } from '@nestjs/testing';
import { PatientBedHistoryController } from './patient_bed_history.controller';

describe('PatientBedHistoryController', () => {
  let controller: PatientBedHistoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PatientBedHistoryController],
    }).compile();

    controller = module.get<PatientBedHistoryController>(PatientBedHistoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
