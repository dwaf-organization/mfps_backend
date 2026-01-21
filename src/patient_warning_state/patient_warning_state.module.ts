import { Module } from '@nestjs/common';
import { PatientWarningStateController } from './patient_warning_state.controller';
import { PatientWarningStateService } from './patient_warning_state.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientWarningStateEntity } from './patient_warning_entity';
import { PatientProfileEntity } from 'src/patient_profile/patient_profile.entity';
import { MeasurementEntity } from 'src/measurement/measurement.entity';
import { WeightMeasurementEntity } from 'src/weight_measurement/weight_measurement.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PatientWarningStateEntity, PatientProfileEntity, MeasurementEntity, WeightMeasurementEntity]),
  ],
  controllers: [PatientWarningStateController],
  providers: [PatientWarningStateService],
  exports: [PatientWarningStateService]
})
export class PatientWarningStateModule {}
