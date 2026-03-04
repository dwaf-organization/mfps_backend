import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientMealRecordsController } from './patient_meal_records.controller';
import { PatientMealRecordsService } from './patient_meal_records.service';
import { PatientMealRecordsEntity } from './patient_meal_records.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PatientMealRecordsEntity])],
  controllers: [PatientMealRecordsController],
  providers: [PatientMealRecordsService],
})
export class PatientMealRecordsModule {}
