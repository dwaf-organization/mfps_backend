import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { MeasurementService } from './measurement.service';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import { CreateMeasurementDto } from './dto/create-measurement.dto';

@Controller('measurement/basic')
export class MeasurementController {
    constructor (
        private readonly measureService: MeasurementService,
    ) {}

    @ResponseMessage('측정값 생성 성공')
    @Post()
    async create(@Body() dto: CreateMeasurementDto) {
        return this.measureService.create(dto);
    }

    @ResponseMessage('측정값 조회 성공')
    @Get()
    async find(
        @Query('device_code') deviceCode: number,
        @Query('patient_code') patientCode: number,
        @Query('measurement_code') cursor?: number
    ) {
        return this.measureService.find(deviceCode, patientCode, cursor);
    }
}
