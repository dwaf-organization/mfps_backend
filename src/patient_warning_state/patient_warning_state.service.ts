import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PatientWarningStateEntity } from './patient_warning_entity';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { CreateWarningDto } from './dto/create-warning.dto';
import { PatientProfileEntity } from 'src/patient_profile/patient_profile.entity';
import { Cron } from '@nestjs/schedule';
import { MeasurementEntity } from 'src/measurement/measurement.entity';
import { WeightMeasurementEntity } from 'src/weight_measurement/weight_measurement.entity';
import {
  calcSensorAverages,
  decideWarningState,
  findLastMovementTime,
} from './posture-analyzer.util';

@Injectable()
export class PatientWarningStateService {
  constructor(
    @InjectRepository(PatientWarningStateEntity)
    private readonly warningRepository: Repository<PatientWarningStateEntity>,
    @InjectRepository(PatientProfileEntity)
    private readonly profileRepository: Repository<PatientProfileEntity>,

    private readonly dataSource: DataSource,
  ) {}

  // 환자 등록 시 초기 경고 상태 생성 (다른 서비스에서 호출)
  async createWithManager(
    manager: EntityManager,
    patient: PatientProfileEntity,
  ) {
    // 이제 patient_code가 PK가 아니므로 여러 개 생성 가능
    // 하지만 초기 생성 시에는 하나만 만들면 됨

    const warning = manager.create(PatientWarningStateEntity, {
      patient_code: patient.patient_code, // FK로 직접 할당
      patientProfile: patient, // 관계 설정
      warning_state: 0, // 초기값: 안정 상태
      description: '초기 등록 상태',
    });

    const saved = await manager.save(PatientWarningStateEntity, warning);

    // 초기 경고 상태값 반환
    return saved.warning_state;
  }

  // GET /api/patient/warning?patient_code=123
  // 특정 환자의 최신 경고 상태 조회
  async findOne(patientCode: number) {
    // patient_code로 검색하되, 가장 최신 것만 가져오기
    const warning = await this.warningRepository.findOne({
      where: { patient_code: patientCode },
      order: { create_at: 'DESC' }, // 생성일 기준 내림차순 (최신이 맨 위)
      relations: ['patientProfile'], // 환자 정보도 함께 가져오기
    });

    if (!warning) {
      throw new NotFoundException('존재하지 않는 환자상태 입니다.');
    }

    return {
      patient_status_code: warning.patient_status_code,
      patient_code: warning.patient_code,
      warning_state: warning.warning_state,
      last_change_at: warning.last_change_at,
      create_at: warning.create_at,
      update_at: warning.update_at,
      description: warning.description,
      patient_name: warning.patientProfile?.patient_name || null,
    };
  }

  // 환자 전체 경고 상태 이력 조회 (새로운 기능)
  async findAll(patientCode: number) {
    const warnings = await this.warningRepository.find({
      where: { patient_code: patientCode },
      order: { create_at: 'DESC' },
      take: 10, // 최근 10개만
    });

    return warnings;
  }

  // 수동으로 경고 상태 생성 (새로운 기능)
  async create(dto: CreateWarningDto) {
    // 환자가 존재하는지 확인
    const patient = await this.profileRepository.findOne({
      where: { patient_code: dto.patient_code },
    });

    if (!patient) {
      throw new NotFoundException('존재하지 않는 환자입니다.');
    }

    // 새로운 경고 상태 생성
    const warning = this.warningRepository.create({
      patient_code: dto.patient_code,
      warning_state: dto.warning_state ?? 0,
      description: dto.description || '수동 입력',
    });

    const saved = await this.warningRepository.save(warning);
    return saved;
  }

  // 스케줄러: 5분마다 모든 환자 자세 분석
  @Cron('*/5 * * * *')
  async checkAllPatientsPosture() {
    console.log('환자 자세 분석 시작...'); // 로그 추가

    // 삭제되지 않은 모든 환자 조회
    const patients = await this.profileRepository.find({
      where: { is_deleted: 0 },
    });

    console.log(`분석할 환자 수: ${patients.length}`);

    // 각 환자별로 분석 실행
    for (const patient of patients) {
      try {
        await this.evaluatePatient(patient.patient_code);
        console.log(`환자 ${patient.patient_code} 분석 완료`);
      } catch (error) {
        console.error(`환자 ${patient.patient_code} 분석 실패:`, error.message);
      }
    }
  }

  // evaluatePatient 메서드 수정
  async evaluatePatient(patientCode: number): Promise<void> {
    try {
      const anchor = new Date();
      const since = new Date(anchor.getTime() - 2 * 60 * 60 * 1000); // 2시간 전

      console.log(`환자 ${patientCode} 자세 분석 시작`);

      // 1. 최신 측정 데이터 시간 확인 (6시간 제한)
      const latestMeasurement = await this.getLatestMeasurement(patientCode);

      if (!latestMeasurement || !latestMeasurement.create_at) {
        console.log(`환자 ${patientCode}: 측정 데이터 없음 - 안정 상태로 설정`);
        await this.createSafeWarningState(patientCode, '측정 데이터 없음');
        return;
      }

      // 안전한 시간 비교
      const timeDiffHours =
        (anchor.getTime() - latestMeasurement.create_at.getTime()) /
        (1000 * 60 * 60);
      if (timeDiffHours > 6) {
        console.log(
          `환자 ${patientCode}: 데이터가 ${timeDiffHours.toFixed(1)}시간 이전 - 안정 상태로 설정`,
        );
        await this.createSafeWarningState(
          patientCode,
          `데이터가 ${Math.round(timeDiffHours)}시간 이전`,
        );
        return;
      }

      // 2. 무게 데이터로 빈 침대 확인 (15000 미만 시 안정 상태)
      const totalWeight = await this.getTotalWeight(
        patientCode,
        latestMeasurement.create_at,
      );
      if (totalWeight < 15000) {
        console.log(
          `환자 ${patientCode}: 총 무게 ${totalWeight} (빈 침대) - 안정 상태로 설정`,
        );
        await this.createSafeWarningState(
          patientCode,
          `빈 침대 (무게: ${totalWeight})`,
        );
        return;
      }

      console.log(
        `환자 ${patientCode}: 조건 만족 (데이터: ${timeDiffHours.toFixed(1)}시간 전, 무게: ${totalWeight}) - 자세 분석 실행`,
      );

      // 3. 기존 자세 분석 로직 실행
      const rows = await this.getWeightRows(patientCode, since);
      if (rows.length === 0) {
        console.log(`환자 ${patientCode}: 2시간 내 체중 데이터 없음`);
        await this.createSafeWarningState(
          patientCode,
          '2시간 내 체중 데이터 없음',
        );
        return;
      }

      const avgMap = calcSensorAverages(rows);
      const lastMove = findLastMovementTime(rows, avgMap);

      // 1. 최신 안전확인 시점 조회
      const latestWarning = await this.warningRepository.findOne({
        where: { patient_code: patientCode },
        order: { create_at: 'DESC' },
      });

      // 2. 기준시점 결정 (센서 움직임 vs 안전확인 중 더 최근 것)
      let baseTime = lastMove;
      const safetyConfirmTime = latestWarning?.last_change_at;

      if (safetyConfirmTime && (!lastMove || safetyConfirmTime > lastMove)) {
        baseTime = safetyConfirmTime;
        console.log(
          `환자 ${patientCode}: 안전확인 기준 적용 (${safetyConfirmTime})`,
        );
      }

      // 3. 기준시점 기반 위험도 계산
      const newState = this.decideWarningStateFromBase(baseTime, anchor);

      const warningData: Partial<PatientWarningStateEntity> = {
        patient_code: patientCode,
        warning_state: newState,
        description: this.getStateDescription(newState, lastMove, anchor),
      };

      if (lastMove) {
        warningData.last_change_at = lastMove;
      }

      const warning = this.warningRepository.create(warningData);
      await this.warningRepository.save(warning);

      console.log(`환자 ${patientCode} 자세 분석 완료: 상태 ${newState}`);
    } catch (error) {
      console.error(`환자 ${patientCode} 분석 중 오류:`, error);
    }
  }

  // 기준시점 기반 위험도 계산
  private decideWarningStateFromBase(
    baseTime: Date | null,
    currentTime: Date,
  ): number {
    if (!baseTime) return 2; // 기준시점 없으면 위험

    const diffMinutes = Math.floor(
      (currentTime.getTime() - baseTime.getTime()) / 60000,
    );

    if (diffMinutes < 60) return 0; // 1시간 미만: 안전
    if (diffMinutes < 120) return 1; // 1-2시간: 주의
    return 2; // 2시간 이상: 위험
  }

  // 최신 측정 데이터 조회
  private async getLatestMeasurement(patientCode: number) {
    const result = await this.dataSource
      .createQueryBuilder()
      .select(['measurement.create_at'])
      .from('measurement', 'measurement')
      .where('measurement.patient_code = :patientCode', { patientCode })
      .orderBy('measurement.create_at', 'DESC')
      .limit(1)
      .getRawOne();

    if (!result) {
      return null;
    }

    // getRawOne()은 create_at 키로 반환
    return {
      create_at: new Date(result.create_at), // Date 객체로 변환
    };
  }

  // 총 무게 계산
  private async getTotalWeight(patientCode: number, measurementTime: Date) {
    const result = await this.dataSource
      .createQueryBuilder()
      .select('SUM(weight.value)', 'totalWeight')
      .from('measurement', 'measurement')
      .leftJoin(
        'weight_measurement',
        'weight',
        'weight.measurement_code = measurement.measurement_code',
      )
      .where('measurement.patient_code = :patientCode', { patientCode })
      .andWhere('measurement.create_at = :measurementTime', { measurementTime })
      .getRawOne();

    return parseFloat(result.totalWeight) || 0;
  }

  // 안전 상태 생성
  private async createSafeWarningState(patientCode: number, reason: string) {
    const warningData: Partial<PatientWarningStateEntity> = {
      patient_code: patientCode,
      warning_state: 0, // 안정 상태
      description: `자동 안정 상태: ${reason}`,
    };

    const warning = this.warningRepository.create(warningData);
    await this.warningRepository.save(warning);
  }

  // 상태 설명 생성
  private getStateDescription(
    state: number,
    lastMove: Date | null,
    anchor: Date,
  ): string {
    switch (state) {
      case 0:
        return lastMove
          ? `안정: 마지막 움직임 ${this.formatTimeDiff(lastMove, anchor)}`
          : '안정: 최근 움직임 감지됨';
      case 1:
        return lastMove
          ? `주의: 마지막 움직임 ${this.formatTimeDiff(lastMove, anchor)}`
          : '주의: 1시간 이상 움직임 없음';
      case 2:
        return lastMove
          ? `위험: 마지막 움직임 ${this.formatTimeDiff(lastMove, anchor)}`
          : '위험: 2시간 이상 움직임 없음';
      default:
        return '알 수 없음';
    }
  }

  // 시간 차이 포맷
  private formatTimeDiff(from: Date, to: Date): string {
    const diffMinutes = Math.floor((to.getTime() - from.getTime()) / 60000);
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;

    if (hours > 0) {
      return `${hours}시간 ${minutes}분 전`;
    }
    return `${minutes}분 전`;
  }

  // 특정 환자의 체중 센서 데이터 조회 (private 메서드)
  private async getWeightRows(patientCode: number, since: Date) {
    return this.dataSource
      .createQueryBuilder()
      .select([
        'm.measurement_code AS measurement_code',
        'm.create_at AS create_at',
        'w.sensor_index AS sensor_index',
        'w.value AS value',
      ])
      .from(MeasurementEntity, 'm')
      .innerJoin(
        WeightMeasurementEntity,
        'w',
        'w.measurement_code = m.measurement_code',
      )
      .where('m.patient_code = :patientCode', { patientCode })
      .andWhere('m.create_at >= :since', { since })
      .orderBy('m.create_at', 'ASC')
      .addOrderBy('w.sensor_index', 'ASC')
      .getRawMany<{
        measurement_code: number;
        create_at: Date;
        sensor_index: number;
        value: number;
      }>();
  }

  // 현재 위험 환자 조회 (GET /api/patient/warning/risk-list)
  async getRiskList() {
    const riskPatients = await this.dataSource.query(`
        SELECT DISTINCT
            pws.patient_code,
            pp.patient_name,
            pp.age,
            pws.warning_state,
            pws.last_change_at,
            pws.description,
            pws.create_at,
            
            -- 병동 구조 정보
            ward.category_name as ward_name,
            floor.category_name as floor_name, 
            room.category_name as room_name,
            bed.category_name as bed_name,
            
            -- 최신 측정 데이터
            m.temperature,
            m.humidity
            
        FROM patient_warning_state pws
        INNER JOIN patient_profile pp ON pws.patient_code = pp.patient_code
        INNER JOIN hospital_structure_info bed ON pp.bed_code = bed.hospital_st_code
        INNER JOIN hospital_structure_info room ON bed.parents_code = room.hospital_st_code  
        INNER JOIN hospital_structure_info floor ON room.parents_code = floor.hospital_st_code
        INNER JOIN hospital_structure_info ward ON floor.parents_code = ward.hospital_st_code
        LEFT JOIN (
            SELECT 
                patient_code,
                temperature,
                humidity,
                ROW_NUMBER() OVER (PARTITION BY patient_code ORDER BY create_at DESC) as rn
            FROM measurement 
        ) m ON pws.patient_code = m.patient_code AND m.rn = 1
        
        WHERE pws.warning_state IN (1, 2)
        AND pws.create_at = (
            SELECT MAX(create_at) 
            FROM patient_warning_state 
            WHERE patient_code = pws.patient_code
        )
        AND pp.is_deleted = 0
        
        ORDER BY pws.warning_state DESC, pws.create_at ASC
    `);
    return riskPatients.map((patient) => {
      const currentTime = new Date();
      const lastChangeTime = new Date(
        patient.last_change_at || patient.create_at,
      );
      const durationHours = Math.floor(
        (currentTime.getTime() - lastChangeTime.getTime()) / (1000 * 60 * 60),
      );

      return {
        patient_code: patient.patient_code,
        patient_name: patient.patient_name,
        patient_age: patient.age,
        hospital_structure: `${patient.ward_name} > ${patient.floor_name} > ${patient.room_name} > ${patient.bed_name}`,
        warning_state: patient.warning_state,
        duration_hours: durationHours,
        temperature: patient.temperature || null,
        humidity: patient.humidity || null,
        last_change_time: lastChangeTime
          .toISOString()
          .replace('T', ' ')
          .split('.')[0],
      };
    });
  }

  // 안전확인 처리 (POST /api/patient/warning/safety-confirm)
  async safetyConfirm(patientCode: number, confirmedBy?: string) {
    const latestWarning = await this.warningRepository.findOne({
      where: { patient_code: patientCode },
      order: { create_at: 'DESC' },
    });

    if (!latestWarning || latestWarning.warning_state === 0) {
      return {
        patient_code: patientCode,
        message: '이미 안전 상태입니다.',
        action: 'no_change',
      };
    }

    const safetyRecord = this.warningRepository.create({
      patient_code: patientCode,
      warning_state: 0,
      last_change_at: new Date(),
      description: `수동 안전확인${confirmedBy ? ` (확인자: ${confirmedBy})` : ''}`,
    });

    await this.warningRepository.save(safetyRecord);

    return {
      patient_code: patientCode,
      previous_state: latestWarning.warning_state,
      current_state: 0,
      confirmed_at: safetyRecord.last_change_at,
      action: 'confirmed',
    };
  }
}
