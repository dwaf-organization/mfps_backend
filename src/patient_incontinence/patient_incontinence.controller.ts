import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { PatientIncontinenceService } from './patient_incontinence.service';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import { CreateIncontinenceDto } from './dto/create-incontinence.dto';

@Controller('patient/incontinence')
export class PatientIncontinenceController {
  constructor(
    private readonly incontinenceService: PatientIncontinenceService,
  ) {}

  @ResponseMessage('월별 실금 데이터 조회 성공')
  @Get('calendar')
  async getCalendar(
    @Query('patient_code') patientCode: number,
    @Query('month') month: string,
  ) {
    return this.incontinenceService.getCalendar(patientCode, month);
  }

  @ResponseMessage('실금 기록 처리 성공')
  @Post()
  async createOrDelete(@Body() dto: CreateIncontinenceDto) {
    return this.incontinenceService.createOrDelete(dto);
  }
}
