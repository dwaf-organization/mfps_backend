import { Test, TestingModule } from '@nestjs/testing';
import { HospitalEmailController } from './hospital_email.controller';

describe('HospitalEmailController', () => {
  let controller: HospitalEmailController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HospitalEmailController],
    }).compile();

    controller = module.get<HospitalEmailController>(HospitalEmailController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
