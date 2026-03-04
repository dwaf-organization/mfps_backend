import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PatientIncontinenceEntity } from './patient_incontinence.entity';
import { CreateIncontinenceDto } from './dto/create-incontinence.dto';

@Injectable()
export class PatientIncontinenceService {
  constructor(
    @InjectRepository(PatientIncontinenceEntity)
    private readonly incontinenceRepository: Repository<PatientIncontinenceEntity>,
  ) {}

  // GET /patient/incontinence/calendar
  async getCalendar(patientCode: number, month: string) {
    const year = month.substring(0, 4);
    const monthNum = month.substring(4, 6);

    const records = await this.incontinenceRepository
      .createQueryBuilder('inc')
      .where('inc.patient_code = :patientCode', { patientCode })
      .andWhere('YEAR(inc.record_date) = :year', { year })
      .andWhere('MONTH(inc.record_date) = :month', { month: monthNum })
      .andWhere('inc.has_incontinence = true')
      .orderBy('inc.record_date', 'ASC')
      .getMany();

    const incontinenceDates = records.map((record) => record.record_date);

    return {
      patient_code: patientCode,
      month: `${year}-${monthNum.padStart(2, '0')}`,
      incontinence_dates: incontinenceDates,
      total_count: records.length,
    };
  }

  // POST /patient/incontinence
  async createOrDelete(dto: CreateIncontinenceDto) {
    // 날짜만 비교하도록 쿼리 수정
    const existingRecord = await this.incontinenceRepository
      .createQueryBuilder('inc')
      .where('inc.patient_code = :patientCode', {
        patientCode: dto.patient_code,
      })
      .andWhere('DATE(inc.record_date) = :recordDate', {
        recordDate: dto.record_date,
      })
      .getOne();

    if (dto.has_incontinence) {
      // ON - 실금 발생 기록 생성
      if (existingRecord) {
        return {
          incontinence_code: existingRecord.incontinence_code,
          patient_code: dto.patient_code,
          record_date: dto.record_date,
          has_incontinence: true,
          action: 'already_exists',
        };
      } else {
        const newRecord = this.incontinenceRepository.create({
          patient_code: dto.patient_code,
          record_date: new Date(dto.record_date),
          has_incontinence: true,
          notes: dto.notes,
        });

        const savedRecord = await this.incontinenceRepository.save(newRecord);

        return {
          incontinence_code: savedRecord.incontinence_code,
          patient_code: dto.patient_code,
          record_date: dto.record_date,
          has_incontinence: true,
          action: 'created',
        };
      }
    } else {
      // OFF - 실금 기록 삭제
      if (!existingRecord) {
        throw new ConflictException('삭제할 실금 기록이 없습니다.');
      }

      await this.incontinenceRepository.delete(
        existingRecord.incontinence_code,
      );

      return {
        patient_code: dto.patient_code,
        record_date: dto.record_date,
        action: 'deleted',
      };
    }
  }
}
