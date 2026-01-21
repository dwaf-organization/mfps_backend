import { Controller, Get, Post, Query } from '@nestjs/common';
import { PatientBedHistoryService } from './patient_bed_history.service';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import { EntityManager } from 'typeorm';

@Controller('patient/bed-history')
export class PatientBedHistoryController {
    constructor (
        private readonly historyService: PatientBedHistoryService,
    ) {}

    @ResponseMessage('환자침상이동내역 생성 성공')
    @Post()
    async create(
        manager: EntityManager,
        params: {
            patient_code: number;
            from_bed_code: number;
            to_bed_code: number;
            },
    ) {
        return this.historyService.createWithManager(manager, params);
    }

    @ResponseMessage('환자침상이동내역 조회 성공')
    @Get()
    async find(@Query('patient_code') patientCode: number) {
        const patient = await this.historyService.find(patientCode);

        return patient;
    }
}
