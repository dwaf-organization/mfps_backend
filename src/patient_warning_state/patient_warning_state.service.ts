import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PatientWarningStateEntity } from './patient_warning_entity';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { CreateWarningDto } from './dto/create-warning.dto';
import { PatientProfileEntity } from 'src/patient_profile/patient_profile.entity';
import { Cron } from '@nestjs/schedule';
import { MeasurementEntity } from 'src/measurement/measurement.entity';
import { WeightMeasurementEntity } from 'src/weight_measurement/weight_measurement.entity';
import { calcSensorAverages, decideWarningState, findLastMovementTime } from './posture-analyzer.util';

@Injectable()
export class PatientWarningStateService {
    constructor (
        @InjectRepository(PatientWarningStateEntity)
        private readonly warningRepository: Repository<PatientWarningStateEntity>,
        @InjectRepository(PatientProfileEntity)
        private readonly profileRepository: Repository<PatientProfileEntity>,

        private readonly dataSource: DataSource,
    ) {}

    // 환자 등록 시 초기 경고 상태 생성 (다른 서비스에서 호출)
    async createWithManager(manager: EntityManager, patient: PatientProfileEntity) {
        // 이제 patient_code가 PK가 아니므로 여러 개 생성 가능
        // 하지만 초기 생성 시에는 하나만 만들면 됨
        
        const warning = manager.create(PatientWarningStateEntity, {
            patient_code: patient.patient_code,  // FK로 직접 할당
            patientProfile: patient,              // 관계 설정
            warning_state: 0,                     // 초기값: 안정 상태
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
            order: { create_at: 'DESC' },  // 생성일 기준 내림차순 (최신이 맨 위)
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
            where: { patient_code: dto.patient_code }
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
            where: { is_deleted: 0 } 
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

    // 특정 환자 1명의 자세 분석 및 경고 상태 업데이트
    async evaluatePatient(patientCode: number) {
        const manager = this.dataSource.manager;

        // 해당 환자의 가장 최신 측정 데이터 조회
        const latest = await manager.findOne(MeasurementEntity, {
            where: { patientCode: { patient_code: patientCode } },
            order: { create_at: 'DESC' },
        });

        if (!latest) {
            console.log(`환자 ${patientCode}: 측정 데이터 없음`);
            return;
        }

        const anchor = latest.create_at;  
        const since = new Date(anchor.getTime() - 2 * 60 * 60 * 1000); // 2시간 전

        // 2시간 동안의 체중 센서 데이터 조회
        const rows = await this.getWeightRows(patientCode, since);
        if (!rows.length) {
            console.log(`환자 ${patientCode}: 체중 센서 데이터 없음`);
            return;
        }

        // 자세 분석 알고리즘 실행
        const avgMap = calcSensorAverages(rows);
        const lastMove = findLastMovementTime(rows, avgMap);
        const newState = decideWarningState(lastMove, anchor);

        // 기존 방식(update) 대신 새로운 레코드 생성
        const warningData: Partial<PatientWarningStateEntity> = {
            patient_code: patientCode,
            warning_state: newState,
            description: this.getStateDescription(newState, lastMove, anchor),
        };

        // null 체크 후 할당
        if (lastMove) {
            warningData.last_change_at = lastMove;
        }

        const warning = this.warningRepository.create(warningData);
        await this.warningRepository.save(warning);

        console.log(`환자 ${patientCode}: 경고상태 ${newState} 생성 완료`);
    }

    // 경고 상태에 따른 설명 생성
    private getStateDescription(state: number, lastMove: Date | null, anchor: Date): string {
        const stateText = state === 2 ? '위험' : state === 1 ? '경고' : '안정';
        
        if (!lastMove) {
            return `${stateText} - 움직임 감지되지 않음 (자동 분석)`;
        }

        const diffMinutes = Math.floor((anchor.getTime() - lastMove.getTime()) / 60000);
        return `${stateText} - 마지막 움직임: ${diffMinutes}분 전 (자동 분석)`;
    }

    // 특정 환자의 체중 센서 데이터 조회 (private 메서드)
    private async getWeightRows(
        patientCode: number,
        since: Date,
    ) {
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
}