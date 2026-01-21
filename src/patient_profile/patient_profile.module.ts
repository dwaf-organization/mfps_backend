import { Module } from '@nestjs/common';
import { PatientProfileController } from './patient_profile.controller';
import { PatientProfileService } from './patient_profile.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientProfileEntity } from './patient_profile.entity';
import { HospitalStructureInfoEntity } from 'src/hospital_structure_info/hospital_structure_info.entity';
import { PatientWarningStateEntity } from 'src/patient_warning_state/patient_warning_entity';
import { PatientWarningStateModule } from 'src/patient_warning_state/patient_warning_state.module';
import { PatientBedHistoryModule } from 'src/patient_bed_history/patient_bed_history.module';
import { DevicePositionEntity } from 'src/device_position/device_position.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PatientProfileEntity, HospitalStructureInfoEntity, PatientWarningStateEntity, DevicePositionEntity, 
    ]),
    PatientWarningStateModule,
    PatientBedHistoryModule,
],
  controllers: [PatientProfileController],
  providers: [PatientProfileService]
})
export class PatientProfileModule {}
