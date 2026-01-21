import { Module } from '@nestjs/common';
import { WeightMeasurementController } from './weight_measurement.controller';
import { WeightMeasurementService } from './weight_measurement.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WeightMeasurementEntity } from './weight_measurement.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WeightMeasurementEntity])],
  controllers: [WeightMeasurementController],
  providers: [WeightMeasurementService],
  exports: [WeightMeasurementService]
})
export class WeightMeasurementModule {}
