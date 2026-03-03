import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientUlcerHistoryController } from './patient_ulcer_history.controller';
import { PatientUlcerHistoryService } from './patient_ulcer_history.service';
import { PatientUlcerHistoryEntity } from './patient_ulcer_history.entity';
import { BodyPartsEntity } from 'src/body_parts/body_parts.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PatientUlcerHistoryEntity, BodyPartsEntity]),
  ],
  controllers: [PatientUlcerHistoryController],
  providers: [PatientUlcerHistoryService],
})
export class PatientUlcerHistoryModule {}
