import { Test, TestingModule } from '@nestjs/testing';
import { PatientWarningStateService } from './patient_warning_state.service';

describe('PatientWarningStateService', () => {
  let service: PatientWarningStateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PatientWarningStateService],
    }).compile();

    service = module.get<PatientWarningStateService>(PatientWarningStateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
