import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { PatientWarningStateService } from './patient_warning_state.service';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';

@Controller('patient/warning')
export class PatientWarningStateController {
  constructor(private readonly warningService: PatientWarningStateService) {}

  @ResponseMessage('환자경고상태 조회 성공')
  @Get()
  async findOne(@Query('patient_code') patientCode: number) {
    return this.warningService.findOne(patientCode);
  }

  @ResponseMessage('현재 위험 환자 조회 성공')
  @Get('risk-list')
  async getRiskList() {
    return this.warningService.getRiskList();
  }

  @ResponseMessage('안전확인 처리 성공')
  @Post('safety-confirm')
  async safetyConfirm(
    @Body() body: { patient_code: number; confirmed_by?: string },
  ) {
    return this.warningService.safetyConfirm(
      body.patient_code,
      body.confirmed_by,
    );
  }
}
