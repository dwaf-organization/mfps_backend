import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { PatientMealRecordsService } from './patient_meal_records.service';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import { CreateMealDto } from './dto/create-meal.dto';

@Controller('patient/meal')
export class PatientMealRecordsController {
  constructor(private readonly mealRecordsService: PatientMealRecordsService) {}

  @ResponseMessage('월별 식사 기록 조회 성공')
  @Get('calendar')
  async getCalendar(
    @Query('patient_code') patientCode: number,
    @Query('month') month: string,
  ) {
    return this.mealRecordsService.getCalendar(patientCode, month);
  }

  @ResponseMessage('식사 기록 처리 성공')
  @Post()
  async createOrUpdate(@Body() dto: CreateMealDto) {
    return this.mealRecordsService.createOrUpdate(dto);
  }
}
