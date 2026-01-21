import { Module } from '@nestjs/common';
import { HospitalEmailController } from './hospital_email.controller';
import { HospitalEmailService } from './hospital_email.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HospitalEmailEntity } from './hospital_email.entity';

@Module({
  imports: [TypeOrmModule.forFeature([HospitalEmailEntity])],
  controllers: [HospitalEmailController],
  providers: [HospitalEmailService]
})
export class HospitalEmailModule {}
