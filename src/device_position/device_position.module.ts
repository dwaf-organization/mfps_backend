import { Module } from '@nestjs/common';
import { DevicePositionController } from './device_position.controller';
import { DevicePositionService } from './device_position.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DevicePositionEntity } from './device_position.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DevicePositionEntity])],
  controllers: [DevicePositionController],
  providers: [DevicePositionService],
})
export class DevicePositionModule {}
