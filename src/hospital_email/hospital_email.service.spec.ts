import { Test, TestingModule } from '@nestjs/testing';
import { HospitalEmailService } from './hospital_email.service';

describe('HospitalEmailService', () => {
  let service: HospitalEmailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HospitalEmailService],
    }).compile();

    service = module.get<HospitalEmailService>(HospitalEmailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
