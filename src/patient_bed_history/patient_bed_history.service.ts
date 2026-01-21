import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PatientBedHistoryEntity } from './patient_bed_history.entity';
import { EntityManager, Repository } from 'typeorm';

@Injectable()
export class PatientBedHistoryService {
    constructor (
        @InjectRepository(PatientBedHistoryEntity)
        private readonly historyRepository: Repository<PatientBedHistoryEntity>,
    ) {}

    // POST /patient/bed-history
    async createWithManager(
        manager: EntityManager,
        params: {
            patient_code: number;
            from_bed_code: number | null;
            to_bed_code: number | null;
        },
    ) {
        const history = manager.create(PatientBedHistoryEntity, {
            patient: { patient_code: params.patient_code },
            fromBedCode: params.from_bed_code
                ? { hospital_st_code: params.from_bed_code }
                : null,
            toBedCode: params.to_bed_code
                ? { hospital_st_code: params.to_bed_code }
                : null,
            });

        return manager.save(PatientBedHistoryEntity, history);
    }

    // GET /patient/bed-history?patient_code={patient_code}
    async find(patientCode: number) {
        const patient = await this.historyRepository.findOneBy({
            patient: { patient_code: patientCode },
        });
        if (!patient) throw new NotFoundException('존재하지 않는 환자 내역 입니다.');

        return patient;
    }
}
