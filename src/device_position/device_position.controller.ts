import { Body, Controller, Post } from '@nestjs/common';
import { DevicePositionService } from './device_position.service';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import { CreatePositionDto } from './dto/create-position.dto';
import { ConnectDeviceDto } from './dto/connect-device.dto';

@Controller('device/position')
export class DevicePositionController {
    constructor (
        private readonly devicePositionService: DevicePositionService,
    ) {}

    // @ResponseMessage('디바이스위치 생성 성공')
    // @Post()
    // async create(@Body() dto: CreatePositionDto) {
    //     return this.posService.create(dto);
    // }

    @ResponseMessage('디바이스 연결 성공')
    @Post('connect')
    async connectDevice(@Body() dto: ConnectDeviceDto) {
        return this.devicePositionService.connectDevice(dto);
    }
}
