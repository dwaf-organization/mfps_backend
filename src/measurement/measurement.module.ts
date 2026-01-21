import { Module } from '@nestjs/common';
import { MeasurementController } from './measurement.controller';
import { MeasurementService } from './measurement.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MeasurementEntity } from './measurement.entity';
import { DeviceStateEntity } from 'src/device_state/device_state.entity';
import { PatientProfileEntity } from 'src/patient_profile/patient_profile.entity';
import { WeightMeasurementEntity } from 'src/weight_measurement/weight_measurement.entity';
import { WeightMeasurementModule } from 'src/weight_measurement/weight_measurement.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MeasurementEntity, DeviceStateEntity, PatientProfileEntity, WeightMeasurementEntity]),
    WeightMeasurementModule,
  ],
  controllers: [MeasurementController],
  providers: [MeasurementService]
})
export class MeasurementModule {}
