import { Module } from '@nestjs/common';
import { HospitalStructureInfoController } from './hospital_structure_info.controller';
import { HospitalStructureInfoService } from './hospital_structure_info.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HospitalStructureInfoEntity } from './hospital_structure_info.entity';
import { HospitalEmailEntity } from 'src/hospital_email/hospital_email.entity';
import { PatientProfileEntity } from 'src/patient_profile/patient_profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([HospitalStructureInfoEntity, HospitalEmailEntity, PatientProfileEntity])],
  controllers: [HospitalStructureInfoController],
  providers: [HospitalStructureInfoService]
})
export class HospitalStructureInfoModule {}
