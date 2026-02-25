import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DevicePositionEntity } from './device_position.entity';
import { CreatePositionDto } from './dto/create-position.dto';
import { Repository } from 'typeorm';
import { DataSource } from 'typeorm';
import { ConnectDeviceDto } from './dto/connect-device.dto';
import { DeviceStateEntity } from 'src/device_state/device_state.entity';
import { HospitalStructureInfoEntity } from 'src/hospital_structure_info/hospital_structure_info.entity';

@Injectable()
export class DevicePositionService {
    constructor(
        @InjectRepository(DevicePositionEntity)
        private readonly devicePositionRepository: Repository<DevicePositionEntity>,

        private readonly dataSource: DataSource,
    ) {}

    // POST /device/position/connect
    async connectDevice(dto: ConnectDeviceDto) {
        return await this.dataSource.transaction(async manager => {

            // 1. 침상이 실제로 존재하는지 확인
            const bed = await manager.findOne(HospitalStructureInfoEntity, {
                where: { hospital_st_code: dto.bed_code }
            });
            if (!bed) {
                throw new NotFoundException('존재하지 않는 침상입니다.');
            }

            // 2. 해당 침상에 이미 연결된 디바이스가 있는지 확인
            const existingDevice = await manager.findOne(DevicePositionEntity, {
                where: { device_loc_code: dto.bed_code },
                relations: ['deviceState']
            });

            if (existingDevice) {
                // 3. 기존 디바이스가 있으면 device_unique_id만 업데이트
                existingDevice.device_unique_id = dto.device_unique_id;
                
                // device_state의 last_seen_at도 업데이트
                if (existingDevice.deviceState) {
                    existingDevice.deviceState.last_seen_at = new Date();
                    await manager.save(existingDevice.deviceState);
                }

                const updatedDevice = await manager.save(existingDevice);

                return {
                    device_code: updatedDevice.device_code,
                    bed_code: dto.bed_code,
                    device_unique_id: updatedDevice.device_unique_id,
                    status: 'updated',
                    message: '기존 디바이스 정보가 업데이트되었습니다.'
                };

            } else {
                // 4. 새로운 디바이스 등록
                
                // 4-1. device_state 먼저 생성
                const deviceState = manager.create(DeviceStateEntity, {
                    device_name: `Device-${dto.bed_code}`, // 기본 이름
                    device_status: 1, // 활성 상태
                    last_seen_at: new Date(),
                });
                const savedDeviceState = await manager.save(deviceState);

                // 4-2. device_position 생성
                const devicePosition = manager.create(DevicePositionEntity, {
                    device_code: savedDeviceState.device_code,
                    device_loc_code: dto.bed_code,
                    device_unique_id: dto.device_unique_id,
                });
                const savedDevicePosition = await manager.save(devicePosition);

                return {
                    device_code: savedDevicePosition.device_code,
                    bed_code: dto.bed_code,
                    device_unique_id: savedDevicePosition.device_unique_id,
                    status: 'created',
                    message: '새로운 디바이스가 등록되었습니다.'
                };
            }
        });
    }

    // // POST /device/position
    // async create(dto: CreatePositionDto) {
    //     const device = await this.posRepository.findOne({ where: { device_code: dto.device_code } });
    //     if (!device) {
    //         const newDevice = this.posRepository.create({
    //             device_code: dto.device_code,
    //             device_loc_code: dto.device_loc_code,
    //             device_unique_id: dto.device_unique_id
    //         });
    
    //         await this.posRepository.save(newDevice);

    //         return {
    //         device_code: Number(newDevice.device_code),
    //         device_loc_code: Number(newDevice.device_loc_code),
    //         device_unique_id: dto.device_unique_id,
    //         };
    //     } else {
    //         device.device_loc_code = dto.device_loc_code;

    //         await this.posRepository.save(device);
    //         return {
    //         device_code: Number(device.device_code),
    //         device_loc_code: Number(device.device_loc_code),
    //         device_unique_id: device.device_unique_id,
    //         };
    //     }
    // }
}
