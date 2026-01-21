import { Module } from '@nestjs/common';
import { PatientBedHistoryController } from './patient_bed_history.controller';
import { PatientBedHistoryService } from './patient_bed_history.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientBedHistoryEntity } from './patient_bed_history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PatientBedHistoryEntity])],
  controllers: [PatientBedHistoryController],
  providers: [PatientBedHistoryService],
  exports: [PatientBedHistoryService],
})
export class PatientBedHistoryModule {}
