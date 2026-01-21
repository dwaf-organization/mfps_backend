import { Body, Controller, Post, Put } from '@nestjs/common';
import { DeviceStateService } from './device_state.service';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import { CreateStateDto } from './dto/create-state.dto';
import { UpdateStateDto } from './dto/update-state.dto';

@Controller('device/state')
export class DeviceStateController {
    constructor (
        private readonly stateService: DeviceStateService,
    ) {}

    @ResponseMessage('디바이스상태 생성 성공')
    @Post()
    async create(@Body() dto: CreateStateDto) {
        return this.stateService.create(dto);
    }

    @ResponseMessage('디바이스상태 수정 성공')
    @Put('update')
    async update(@Body() dto: UpdateStateDto) {
        return this.stateService.update(dto);
    }
}
