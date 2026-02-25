import { Module } from '@nestjs/common';
import { DevicePositionController } from './device_position.controller';
import { DevicePositionService } from './device_position.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DevicePositionEntity } from './device_position.entity';
import { DeviceStateEntity } from 'src/device_state/device_state.entity';
import { HospitalStructureInfoEntity } from 'src/hospital_structure_info/hospital_structure_info.entity';

@Module({
    imports: [
    TypeOrmModule.forFeature([
      DevicePositionEntity, 
      DeviceStateEntity, 
      HospitalStructureInfoEntity
    ])
  ],
  controllers: [DevicePositionController],
  providers: [DevicePositionService],
})
export class DevicePositionModule {}
