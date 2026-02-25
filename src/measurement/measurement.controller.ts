import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { MeasurementService } from './measurement.service';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import { CreateMeasurementDto } from './dto/create-measurement.dto';
import { CreateCsvMeasurementDto } from './dto/create-csv-measurement.dto';

@Controller('measurement/basic')
export class MeasurementController {
    constructor (
        private readonly measureService: MeasurementService,
    ) {}

    @ResponseMessage('측정값 생성 성공')
    @Post()
    async create(@Body() dto: CreateCsvMeasurementDto) {
        return this.measureService.createFromCsv(dto);
    }

    @ResponseMessage('최신 측정값 조회 성공')
    @Get()
    async find(@Query('patient_code') patientCode: number) {
        return this.measureService.findLatest(patientCode);
    }

    @ResponseMessage('차트 데이터 조회 성공')
    @Get('chart')
    async getChartData(@Query('patient_code') patientCode: number) {
        return this.measureService.getChartData(patientCode);
    }

    // 기존 JSON 방식 (필요시 유지)
    @ResponseMessage('측정값 생성 성공 (JSON)')
    @Post('json')
    async createFromJson(@Body() dto: CreateMeasurementDto) {
        return this.measureService.create(dto);
    }
}