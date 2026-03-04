import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientIncontinenceController } from './patient_incontinence.controller';
import { PatientIncontinenceService } from './patient_incontinence.service';
import { PatientIncontinenceEntity } from './patient_incontinence.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PatientIncontinenceEntity])],
  controllers: [PatientIncontinenceController],
  providers: [PatientIncontinenceService],
})
export class PatientIncontinenceModule {}
