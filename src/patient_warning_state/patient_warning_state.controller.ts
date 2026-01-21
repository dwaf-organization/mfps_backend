import { Controller, Get, Query } from '@nestjs/common';
import { PatientWarningStateService } from './patient_warning_state.service';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';

@Controller('patient/warning')
export class PatientWarningStateController {
    constructor (
        private readonly warningService: PatientWarningStateService,
    ) {}

    @ResponseMessage('환자경고상태 조회 성공')
    @Get()
    async findOne(@Query('patient_code') patientCode: number) {
        return this.warningService.findOne(patientCode);
    }
}
