import { Test, TestingModule } from '@nestjs/testing';
import { HospitalStructureInfoController } from './hospital_structure_info.controller';

describe('HospitalStructureInfoController', () => {
  let controller: HospitalStructureInfoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HospitalStructureInfoController],
    }).compile();

    controller = module.get<HospitalStructureInfoController>(HospitalStructureInfoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
