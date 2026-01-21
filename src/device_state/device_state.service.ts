import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeviceStateEntity } from './device_state.entity';
import { Repository } from 'typeorm';
import { CreateStateDto } from './dto/create-state.dto';
import { UpdateStateDto } from './dto/update-state.dto';

@Injectable()
export class DeviceStateService {
    constructor (
        @InjectRepository(DeviceStateEntity)
        private readonly stateRepository: Repository<DeviceStateEntity>,
    ) {}

    // POST /device/state
    async create(dto: CreateStateDto) {
        const device = this.stateRepository.create(dto);

        const saved = await this.stateRepository.save(device);

        return {
            device_code: Number(saved.device_code),
            is_active: saved.is_active,
            last_seen_at: saved.last_seen_at,
            create_at: saved.create_at,
            note: saved.note,
            description: saved.description,
        };
    }

    // PUT /device/state/update
    async update(dto: UpdateStateDto) {
        const device = await this.stateRepository.findOne({ where: { device_code: dto.device_code } });
        if (!device) throw new NotFoundException('존재하지 않는 디바이스 입니다.');

        device.is_active = dto.is_active ?? device.is_active;
        device.last_seen_at = dto.last_seen_at ?? device.last_seen_at;
        device.note = dto.note ?? device.note;
        device.description = dto.description ?? device.description;

        const updateDevice = await this.stateRepository.save(device);

        return {
            device_code: updateDevice.device_code,
            is_active: updateDevice.is_active,
            last_seen_at: updateDevice.last_seen_at,
            create_at: updateDevice.create_at,
            update_at: updateDevice.update_at,
            note: updateDevice.note,
            description: updateDevice.description,
        };
    }
}
