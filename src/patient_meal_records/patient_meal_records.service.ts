import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PatientMealRecordsEntity } from './patient_meal_records.entity';
import { CreateMealDto } from './dto/create-meal.dto';

@Injectable()
export class PatientMealRecordsService {
  constructor(
    @InjectRepository(PatientMealRecordsEntity)
    private readonly mealRecordsRepository: Repository<PatientMealRecordsEntity>,
  ) {}

  // GET /patient/meal/calendar
  async getCalendar(patientCode: number, month: string) {
    const year = month.substring(0, 4);
    const monthNum = month.substring(4, 6);

    const records = await this.mealRecordsRepository
      .createQueryBuilder('meal')
      .where('meal.patient_code = :patientCode', { patientCode })
      .andWhere('YEAR(meal.record_date) = :year', { year })
      .andWhere('MONTH(meal.record_date) = :month', { month: monthNum })
      .orderBy('meal.record_date', 'ASC')
      .getMany();

    // 날짜별로 그룹핑
    const groupedByDate = {};
    records.forEach((record) => {
      const dateStr = record.record_date.toString();
      if (!groupedByDate[dateStr]) {
        groupedByDate[dateStr] = {};
      }

      const mealTypeName = this.getMealTypeName(record.meal_type_code);
      const intakeName = this.getIntakeName(record.intake_level_code);

      groupedByDate[dateStr][mealTypeName] = {
        intake_code: record.intake_level_code,
        intake_name: intakeName,
      };
    });

    // 응답 형식 변환
    const mealRecords = Object.keys(groupedByDate).map((date) => {
      const meals = groupedByDate[date];
      return {
        record_date: date,
        ...meals,
      };
    });

    return {
      patient_code: patientCode,
      month: `${year}-${monthNum.padStart(2, '0')}`,
      meal_records: mealRecords,
    };
  }

  // POST /patient/meal
  async createOrUpdate(dto: CreateMealDto) {
    const mealTypes = { breakfast: 1, lunch: 2, dinner: 3 };
    const processedMeals = { created: 0, updated: 0, deleted: 0 };
    const results = {};

    for (const [mealType, intakeCode] of Object.entries(dto.meals)) {
      const mealTypeCode = mealTypes[mealType];

      // 기존 기록 확인
      const existingRecord = await this.mealRecordsRepository
        .createQueryBuilder('meal')
        .where('meal.patient_code = :patientCode', {
          patientCode: dto.patient_code,
        })
        .andWhere('DATE(meal.record_date) = :recordDate', {
          recordDate: dto.record_date,
        })
        .andWhere('meal.meal_type_code = :mealTypeCode', { mealTypeCode })
        .getOne();

      if (intakeCode === 0) {
        // 식사전 = 데이터 삭제
        if (existingRecord) {
          await this.mealRecordsRepository.delete(
            existingRecord.meal_record_code,
          );
          results[mealType] = { action: 'deleted', intake_name: '식사전' };
          processedMeals.deleted++;
        } else {
          results[mealType] = { action: 'no_change', intake_name: '식사전' };
        }
      } else {
        // 전량섭취 또는 결식 = 데이터 생성/수정
        const intakeName = this.getIntakeName(intakeCode);

        if (existingRecord) {
          // 수정
          existingRecord.intake_level_code = intakeCode;
          await this.mealRecordsRepository.save(existingRecord);
          results[mealType] = { action: 'updated', intake_name: intakeName };
          processedMeals.updated++;
        } else {
          // 생성
          const newRecord = this.mealRecordsRepository.create({
            patient_code: dto.patient_code,
            record_date: new Date(dto.record_date),
            meal_type_code: mealTypeCode,
            intake_level_code: intakeCode,
          });
          await this.mealRecordsRepository.save(newRecord);
          results[mealType] = { action: 'created', intake_name: intakeName };
          processedMeals.created++;
        }
      }
    }

    return {
      patient_code: dto.patient_code,
      record_date: dto.record_date,
      processed: results,
      summary: processedMeals,
    };
  }

  private getMealTypeName(code: number): string {
    const types = { 1: 'breakfast', 2: 'lunch', 3: 'dinner' };
    return types[code] || 'unknown';
  }

  private getIntakeName(code: number): string {
    const intakes = { 1: '전량섭취', 5: '결식', 0: '식사전' };
    return intakes[code] || '알 수 없음';
  }
}
