import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PatientProfileEntity } from './patient_profile.entity';
import { DataSource, In, Repository } from 'typeorm';
import { CreateProfileDto } from './dto/create-profile.dto';
import { HospitalStructureInfoEntity } from 'src/hospital_structure_info/hospital_structure_info.entity';
import { PatientWarningStateService } from 'src/patient_warning_state/patient_warning_state.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PatientBedHistoryService } from 'src/patient_bed_history/patient_bed_history.service';
import { empty } from 'rxjs';
import { DevicePositionEntity } from 'src/device_position/device_position.entity';

@Injectable()
export class PatientProfileService {
    constructor (
        @InjectRepository(PatientProfileEntity)
        private readonly profileRepository: Repository<PatientProfileEntity>,
        @InjectRepository(HospitalStructureInfoEntity)
        private readonly structureRepository: Repository<HospitalStructureInfoEntity>,
        @InjectRepository(DevicePositionEntity)
        private readonly posRepository: Repository<DevicePositionEntity>,

        private readonly warningService: PatientWarningStateService,
        private readonly historyService: PatientBedHistoryService,

        private readonly dataSource: DataSource,
    ) {}

    // POST /patient/profile
    async create(dto: CreateProfileDto) {
        return await this.dataSource.transaction(async manager => {

            const bed = await manager.findOneBy(HospitalStructureInfoEntity, { hospital_st_code: dto.bed_code });
            if (!bed) throw new NotFoundException('존재하지 않는 침상입니다.');
            
            const patient = await manager.findOne(PatientProfileEntity, {
                where: {
                    bedCode: { hospital_st_code: dto.bed_code },
                    is_deleted: 0,
                }
            });
            
            if (patient) throw new ConflictException('사용중인 침상입니다.');
            
            const newPatient = manager.create(PatientProfileEntity, {
                patient_name: dto.patient_name,
                gender: dto.gender,
                age: dto.age,
                birth_date: dto.birth_date,
                bedCode: bed,
                nurse: dto.nurse,
                doctor: dto.doctor,
                diagnosis: dto.diagnosis,
                allergy: dto.allergy,
                significant: dto.significant,
            });
            
            const savePatient = await manager.save(PatientProfileEntity, newPatient);
            const patientWarning = await this.warningService.createWithManager(manager, savePatient);
            
            return {
                patient_code: newPatient.patient_code,
                patient_name: newPatient.patient_name,
                gender: newPatient.gender,
                age: newPatient.age,
                birth_date: newPatient.birth_date,
                bed_code: newPatient.bedCode?.hospital_st_code,
                nurse: newPatient.nurse,
                doctor: newPatient.doctor,
                diagnosis: newPatient.diagnosis,
                allergy: newPatient.allergy,
                significant: newPatient.significant,
                create_at: newPatient.create_at,
                note: newPatient.note,
                description: newPatient.description,
                warning_state: patientWarning,
            };
        });
    }

    //GET /patient/profile?patient_code={patient_code}
    async findOne(patientCode: number) {
        const patient = await this.profileRepository.findOne({ 
            where: { patient_code: patientCode },
            relations: { bedCode: true }
        });
        if (!patient) throw new NotFoundException('존재하지 않는 환자입니다.');

        const device_position = await this.posRepository.findOne({ where: { device_loc_code : patient.bedCode?.hospital_st_code } });


        const bed = await this.structureRepository.findOneBy({ hospital_st_code: patient.bedCode?.hospital_st_code });
        if (!bed) throw new NotFoundException('존재하지 않는 침상입니다.');

        return {
            patient_code: patient.patient_code,
            patient_name: patient.patient_name,
            gender: patient.gender,
            age: patient.age,
            birth_date: patient.birth_date,
            bed_code: patient.bedCode?.hospital_st_code,
            device_code: device_position?.device_code,
            nurse: patient.nurse,
            doctor: patient.doctor,
            diagnosis: patient.diagnosis,
            allergy: patient.allergy,
            significant: patient.significant,
            note: patient.note,
            description: patient.description,
        }
    }

    // PUT /patient/profile/update
    async update(dto: UpdateProfileDto) {
        return await this.dataSource.transaction(async manager => {

            const patient = await manager.findOne(PatientProfileEntity, { 
                where: { patient_code: dto.patient_code },
                relations: ['bedCode'],
             });

            if (!patient) throw new NotFoundException('존재하지 않는 환자입니다');
             
            const oldBedCode = patient.bedCode?.hospital_st_code;
            
            if (dto.bed_code != oldBedCode) {
                const newBed = await manager.findOne(HospitalStructureInfoEntity, {
                    where: { hospital_st_code: dto.bed_code }
                });

                if (!newBed) throw new NotFoundException('존재하지 않는 침상 입니다.');

                patient.bedCode = newBed;

                await this.historyService.createWithManager(manager, {
                    patient_code: patient.patient_code,
                    from_bed_code: oldBedCode ?? null,
                    to_bed_code: dto.bed_code ?? null,
                });
            }
    
            patient.patient_name = dto.patient_name;
            patient.gender = dto.gender;
            patient.age = dto.age;
            patient.birth_date = dto.birth_date;
            patient.nurse = dto.nurse ?? patient.nurse;
            patient.doctor = dto.doctor ?? patient.doctor;
            patient.diagnosis = dto.diagnosis ?? patient.diagnosis;
            patient.allergy = dto.allergy ?? patient.allergy;
            patient.significant = dto.significant ?? patient.significant;
            patient.note = dto.note ?? patient.note;
            patient.description = dto.description ?? patient.description;
            
            const updatePatient = await manager.save(PatientProfileEntity, patient);
    
            return {
                patient_code: updatePatient.patient_code,
                patient_name: updatePatient.patient_name,
                gender: updatePatient.gender,
                age: updatePatient.age,
                birth_date: updatePatient.birth_date,
                bed_code: updatePatient.bedCode?.hospital_st_code,
                nurse: updatePatient.nurse,
                doctor: updatePatient.doctor,
                diagnosis: updatePatient.diagnosis,
                allergy: updatePatient.allergy,
                significant: updatePatient.significant,
                update_at: updatePatient.update_at,
                note: updatePatient.note,
                description: updatePatient.description,
            };
        })
    }

    // DELETE /patient/profile/delete/{patient_code}
    async delete(patientCode: number) {
        const patient = await this.profileRepository.findOne({ 
            where: { patient_code: patientCode, is_deleted: 0 },
            relations: ['bedCode'],
         });
        if (!patient) throw new NotFoundException('존재하지 않는 환자 입니다.');

        patient.is_deleted = 1;
        patient.bedCode = null;

        await this.profileRepository.save(patient);
    }

    // GET /patient/profile/bed-history?hospital_st_code={hospital_st_code}
    async findEmptyBed(floorCode: number) {
        const floor = await this.structureRepository.findOne({
            where: { hospital_st_code: floorCode }
        });
        if (!floor) throw new NotFoundException('존재하지 않는 층입니다');
        if (floor.level !== 2) throw new BadRequestException('층 코드를 입력해 주세요');

        const rooms = await this.structureRepository.find({
            where: { parents: { hospital_st_code: floorCode } }
        });

        const roomCodes = rooms.map(r => r.hospital_st_code);
        if (roomCodes.length === 0) return [];

        const beds = await this.structureRepository.find({
            where: { parents: In(roomCodes) },
            relations: ['parents'],
        });

        const usedPatients = await this.profileRepository.find({
            where: { is_deleted: 0 },
            relations: ['bedCode'],
        });

        const usedBedCodes = new Set(
            usedPatients.map(p => p.bedCode?.hospital_st_code),
        );

        const emptyBeds = beds.filter(
            bed => !usedBedCodes.has(bed.hospital_st_code),
        );

        return emptyBeds.map(bed => ({
            hospital_st_code: bed.hospital_st_code,
            value: `${bed.parents?.category_name} ${bed.category_name}`,
        }));
    }
}
