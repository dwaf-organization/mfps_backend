import { Test, TestingModule } from '@nestjs/testing';
import { PatientBedHistoryService } from './patient_bed_history.service';

describe('PatientBedHistoryService', () => {
  let service: PatientBedHistoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PatientBedHistoryService],
    }).compile();

    service = module.get<PatientBedHistoryService>(PatientBedHistoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
