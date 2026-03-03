import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  Param,
} from '@nestjs/common';
import { PatientUlcerHistoryService } from './patient_ulcer_history.service';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import { CreateUlcerDto } from './dto/create-ulcer.dto';

@Controller('patient/ulcer/history')
export class PatientUlcerHistoryController {
  constructor(
    private readonly ulcerHistoryService: PatientUlcerHistoryService,
  ) {}

  @ResponseMessage('현재 욕창 상태 조회 성공')
  @Get('current')
  async getCurrentStatus(@Query('patient_code') patientCode: number) {
    return this.ulcerHistoryService.getCurrentStatus(patientCode);
  }

  @ResponseMessage('욕창 단계 입력 성공')
  @Post()
  async create(@Body() dto: CreateUlcerDto) {
    return this.ulcerHistoryService.create(dto);
  }

  @ResponseMessage('욕창 추이 차트 조회 성공')
  @Get('chart')
  async getChart(@Query('patient_code') patientCode: number) {
    const chartData = await this.ulcerHistoryService.getChart(patientCode);
    return {
      patient_code: patientCode,
      chart_data: chartData,
    };
  }

  @ResponseMessage('욕창 이력 조회 성공')
  @Get()
  async getHistory(
    @Query('patient_code') patientCode: number,
    @Query('page') page: number = 1,
    @Query('size') size: number = 10,
  ) {
    return this.ulcerHistoryService.getHistory(patientCode, page, size);
  }

  @ResponseMessage('욕창 기록 삭제 성공')
  @Delete(':history_code')
  async delete(@Param('history_code') historyCode: number) {
    return this.ulcerHistoryService.delete(historyCode);
  }
}
