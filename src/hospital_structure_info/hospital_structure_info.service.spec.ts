import { Test, TestingModule } from '@nestjs/testing';
import { HospitalStructureInfoService } from './hospital_structure_info.service';

describe('HospitalStructureInfoService', () => {
  let service: HospitalStructureInfoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HospitalStructureInfoService],
    }).compile();

    service = module.get<HospitalStructureInfoService>(HospitalStructureInfoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
