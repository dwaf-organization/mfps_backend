import { Test, TestingModule } from '@nestjs/testing';
import { PatientWarningStateController } from './patient_warning_state.controller';

describe('PatientWarningStateController', () => {
  let controller: PatientWarningStateController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PatientWarningStateController],
    }).compile();

    controller = module.get<PatientWarningStateController>(PatientWarningStateController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
