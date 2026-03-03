import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PatientUlcerHistoryEntity } from './patient_ulcer_history.entity';
import { BodyPartsEntity } from 'src/body_parts/body_parts.entity';
import { CreateUlcerDto } from './dto/create-ulcer.dto';

@Injectable()
export class PatientUlcerHistoryService {
  constructor(
    @InjectRepository(PatientUlcerHistoryEntity)
    private readonly ulcerHistoryRepository: Repository<PatientUlcerHistoryEntity>,

    @InjectRepository(BodyPartsEntity)
    private readonly bodyPartsRepository: Repository<BodyPartsEntity>,
  ) {}

  // getCurrentStatus 메서드 수정
  async getCurrentStatus(patientCode: number) {
    const bodyParts = await this.bodyPartsRepository.find({
      order: { sort_order: 'ASC' },
    });

    // 배열 타입 명시
    const currentStatus: any[] = []; // 또는 interface 정의해서 사용

    for (const part of bodyParts) {
      const latestRecord = await this.ulcerHistoryRepository
        .createQueryBuilder('ulcer')
        .where('ulcer.patient_code = :patientCode', { patientCode })
        .andWhere('ulcer.part_code = :partCode', { partCode: part.part_code })
        .orderBy('ulcer.record_date', 'DESC')
        .limit(1)
        .getOne();

      if (latestRecord) {
        console.log('=== latestRecord ===', latestRecord);
        console.log(
          '=== record_date 타입 ===',
          typeof latestRecord.record_date,
        );
        console.log('=== record_date 값 ===', latestRecord.record_date);
        const stageName = this.getStageNameByCode(latestRecord.stage_code);

        let formattedDate = '';
        if (latestRecord.record_date) {
          const dateObj = new Date(latestRecord.record_date);
          formattedDate = dateObj.toISOString().split('T')[0];
        }

        currentStatus.push({
          part_code: part.part_code,
          part_name: part.part_name,
          stage_code: latestRecord.stage_code,
          stage_name: stageName,
          stage_level: latestRecord.stage_code,
          last_record_date: latestRecord.record_date,
        });
      } else {
        currentStatus.push({
          part_code: part.part_code,
          part_name: part.part_name,
          stage_code: 0,
          stage_name: '0단계 (없음)',
          stage_level: 0,
          last_record_date: null,
        });
      }
    }

    return currentStatus;
  }

  // POST /patient/ulcer/history
  async create(dto: CreateUlcerDto) {
    const newRecord = this.ulcerHistoryRepository.create({
      patient_code: dto.patient_code,
      part_code: dto.part_code,
      stage_code: dto.stage_code,
      record_date: new Date(dto.record_date),
      notes: dto.notes,
    });

    const savedRecord = await this.ulcerHistoryRepository.save(newRecord);

    const bodyPart = await this.bodyPartsRepository.findOne({
      where: { part_code: dto.part_code },
    });

    return {
      history_code: savedRecord.history_code,
      patient_code: savedRecord.patient_code,
      record_date: savedRecord.record_date.toISOString().split('T')[0],
      part_name: bodyPart?.part_name,
      stage_name: this.getStageNameByCode(savedRecord.stage_code),
      stage_level: savedRecord.stage_code,
      notes: savedRecord.notes,
    };
  }

  // GET /patient/ulcer/history/chart
  async getChart(patientCode: number) {
    const bodyParts = await this.bodyPartsRepository.find({
      order: { sort_order: 'ASC' },
    });

    const chartData = {};

    for (const part of bodyParts) {
      const records = await this.ulcerHistoryRepository.find({
        where: {
          patient_code: patientCode,
          part_code: part.part_code,
        },
        order: { record_date: 'ASC' },
      });

      chartData[part.part_name] = records.map((record) => ({
        date: record.record_date,
        stage_level: record.stage_code,
      }));
    }

    return chartData;
  }

  private getStageNameByCode(stageCode: number): string {
    const stageNames = {
      0: '0단계 (없음)',
      1: '1단계',
      2: '2단계',
      3: '3단계',
      4: '4단계',
    };
    return stageNames[stageCode] || '알 수 없음';
  }

  async getHistory(patientCode: number, page: number = 1, size: number = 10) {
    // 1. COUNT 쿼리 (총 개수)
    const totalQuery = await this.ulcerHistoryRepository
      .createQueryBuilder('ulcer')
      .where('ulcer.patient_code = :patientCode', { patientCode })
      .getCount();

    // 2. 데이터 쿼리 (원시 SQL로 날짜 그대로 가져오기)
    const records = await this.ulcerHistoryRepository
      .createQueryBuilder('ulcer')
      .addSelect(
        'DATE_FORMAT(ulcer.created_at, "%Y-%m-%d %H:%i:%s")',
        'formatted_created_at',
      )
      .where('ulcer.patient_code = :patientCode', { patientCode })
      .orderBy('ulcer.record_date', 'DESC')
      .addOrderBy('ulcer.created_at', 'DESC')
      .take(size)
      .skip((page - 1) * size)
      .getRawAndEntities();

    const historyData = await Promise.all(
      records.entities.map(async (record, index) => {
        const bodyPart = await this.bodyPartsRepository.findOne({
          where: { part_code: record.part_code },
        });

        return {
          history_code: record.history_code,
          record_date: record.record_date,
          part_name: bodyPart?.part_name || '알 수 없음',
          stage_name: this.getStageNameByCode(record.stage_code),
          stage_level: record.stage_code,
          notes: record.notes,
          created_at: records.raw[index].formatted_created_at, // ← DB 원본 시간 사용
        };
      }),
    );

    return {
      patient_code: patientCode,
      total_count: totalQuery,
      page,
      size,
      total_pages: Math.ceil(totalQuery / size),
      records: historyData,
    };
  }

  // DELETE /patient/ulcer/history/:history_code
  async delete(historyCode: number) {
    const record = await this.ulcerHistoryRepository.findOne({
      where: { history_code: historyCode },
    });

    if (!record) {
      throw new NotFoundException('삭제할 욕창 기록을 찾을 수 없습니다.');
    }

    const bodyPart = await this.bodyPartsRepository.findOne({
      where: { part_code: record.part_code },
    });

    await this.ulcerHistoryRepository.delete(historyCode);

    return {
      deleted_history_code: historyCode,
      deleted_record: {
        patient_code: record.patient_code,
        part_name: bodyPart?.part_name,
        record_date: record.record_date,
        stage_name: this.getStageNameByCode(record.stage_code),
      },
    };
  }
}
