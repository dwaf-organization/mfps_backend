import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { DeviceStateModule } from './device_state/device_state.module';
import { MeasurementModule } from './measurement/measurement.module';
import { DevicePositionModule } from './device_position/device_position.module';
import { PatientProfileModule } from './patient_profile/patient_profile.module';
import { PatientBedHistoryModule } from './patient_bed_history/patient_bed_history.module';
import { HospitalStructureInfoModule } from './hospital_structure_info/hospital_structure_info.module';
import { HospitalEmailModule } from './hospital_email/hospital_email.module';
import { DeviceStateEntity } from './device_state/device_state.entity';
import { DevicePositionEntity } from './device_position/device_position.entity';
import { HospitalStructureInfoEntity } from './hospital_structure_info/hospital_structure_info.entity';
import { HospitalEmailEntity } from './hospital_email/hospital_email.entity';
import { PatientProfileEntity } from './patient_profile/patient_profile.entity';
import { MeasurementEntity } from './measurement/measurement.entity';
import { PatientWarningStateModule } from './patient_warning_state/patient_warning_state.module';
import { WeightMeasurementModule } from './weight_measurement/weight_measurement.module';
import { PatientBedHistoryEntity } from './patient_bed_history/patient_bed_history.entity';
import { PatientWarningStateEntity } from './patient_warning_state/patient_warning_entity';
import { WeightMeasurementEntity } from './weight_measurement/weight_measurement.entity';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'mariadb',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: 
      [
        DeviceStateEntity,
        DevicePositionEntity,
        HospitalStructureInfoEntity,
        HospitalEmailEntity,
        PatientProfileEntity,
        MeasurementEntity,
        PatientBedHistoryEntity,
        PatientWarningStateEntity,
        WeightMeasurementEntity,
      ],
      synchronize: false,
    }),
    DeviceStateModule,
    MeasurementModule,
    DevicePositionModule,
    PatientProfileModule,
    PatientBedHistoryModule,
    HospitalStructureInfoModule,
    HospitalEmailModule,
    PatientWarningStateModule,
    WeightMeasurementModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
})
export class AppModule {}
