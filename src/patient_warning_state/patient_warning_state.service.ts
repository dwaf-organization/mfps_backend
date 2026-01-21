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

    // POST /patient/warning
    async createWithManager(manager: EntityManager, patient: PatientProfileEntity) {
        const exists = await manager.findOneBy(PatientWarningStateEntity, { patient_code: patient.patient_code });
        if (exists) throw new ConflictException('이미 존재하는 회원입니다.');

        const warning = manager.create(PatientWarningStateEntity, {
            patientProfile: patient,
        });

        await manager.save(PatientWarningStateEntity, warning);

        return warning.warning_state;
    }

    // GET /patient/warning?patient_code={patient_code}
    async findOne(patientCode: number) {
        const patient = await this.warningRepository.findOneBy({ patient_code: patientCode });
        if (!patient) throw new NotFoundException('존재하지 않는 환자상태 입니다.');

        return patient;
    }

    // 스케줄러, 5분 마다
    @Cron('*/5 * * * *')
    async checkAllPatientsPosture() {
        const patients = await this.profileRepository.find({ where: { is_deleted: 0 } });

        for (const p of patients) {
            await this.evaluatePatient(p.patient_code);
        }
    }

    // 환자 1명 검사
    async evaluatePatient(patientCode: number) {
        const manager = this.dataSource.manager;

        const latest = await manager.findOne(MeasurementEntity, {
            where: { patientCode: { patient_code: patientCode } },
            order: { create_at: 'DESC' },
            });

        if (!latest) return;

        const anchor = latest.create_at;  
        const since = new Date(anchor.getTime() - 2 * 60 * 60 * 1000); 

        const rows = await this.getWeightRows(patientCode, since);
        if (!rows.length) return;

        const avgMap = calcSensorAverages(rows);
        const lastMove = findLastMovementTime(rows, avgMap);
        const newState = decideWarningState(lastMove, anchor);

        const updatePayload: Partial<PatientWarningStateEntity> = {
            warning_state: newState,
        };
        if (lastMove) updatePayload.last_change_at = lastMove;

        await this.warningRepository.update(
            { patient_code: patientCode },
            updatePayload,
        );
    }

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
