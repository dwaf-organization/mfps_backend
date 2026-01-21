import { Module } from '@nestjs/common';
import { DeviceStateController } from './device_state.controller';
import { DeviceStateService } from './device_state.service';
import { DeviceStateEntity } from './device_state.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([DeviceStateEntity])],
  controllers: [DeviceStateController],
  providers: [DeviceStateService],
  exports: [],
})
export class DeviceStateModule {}
