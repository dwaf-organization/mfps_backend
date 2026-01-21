import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { HospitalStructureInfoEntity } from './hospital_structure_info.entity';
import { In, IsNull, Repository } from 'typeorm';
import { CreateStructureDto } from './dto/create-structure.dto';
import { HospitalEmailEntity } from 'src/hospital_email/hospital_email.entity';
import { PatientProfileEntity } from 'src/patient_profile/patient_profile.entity';
import { UpdateStructureDto } from './dto/update-structure.dto';

@Injectable()
export class HospitalStructureInfoService {
    constructor (
        @InjectRepository(HospitalStructureInfoEntity)
        private readonly structureRepository: Repository<HospitalStructureInfoEntity>,
        @InjectRepository(HospitalEmailEntity)
        private readonly emailRepository: Repository<HospitalEmailEntity>,
        @InjectRepository(PatientProfileEntity)
        private readonly profileRepository: Repository<PatientProfileEntity>,
    ) {}

    // POST /hospital/structure
    async create(dto: CreateStructureDto) {
        let level = 1;
        let sort_order = 0;
        let parent: HospitalStructureInfoEntity | null = null;

        const hospital = await this.emailRepository.findOneBy({ hospital_code: dto.hospital_code });
        if (!hospital) throw new NotFoundException('존재하지 않는 병원입니다.');
        
        if (dto.parents_code) {
            parent = await this.structureRepository.findOne({
                where: { hospital_st_code: dto.parents_code }
            });

            if (!parent) throw new NotFoundException('부모 레벨이 존재하지 않습니다.');

            const childCount = await this.structureRepository.count({
                where: { 
                    parents: { hospital_st_code: parent.hospital_st_code }
                }
            });

            level = parent.level + 1;
            sort_order = childCount + 1;
        } else {
            const partCount = await this.structureRepository.count({
                where: {
                    hospitalCode: { hospital_code: dto.hospital_code },
                    parents: IsNull(),
                }
            });
            sort_order = partCount + 1;
        }

        const structure = this.structureRepository.create({
            hospitalCode: hospital,
            category_name: dto.category_name,
            level,
            parents: parent ?? undefined,
            sort_order,
            note: dto.note,
            description: dto.description,
        });

        await this.structureRepository.save(structure);

        return {
            hospital_st_code: structure.hospital_st_code,
            hospital_code: structure.hospital_code,
            category_name: structure.category_name,
            level: structure.level,
            parents_code: structure.parents?.hospital_st_code ?? null,
            sort_order: structure.sort_order,
            create_at: structure.create_at,
            note: structure.note,
            description: structure.description,
        }
    }

    // GET /hospital/structure/part?hospital_code{hospital_code}
    async partcheck(hospitalCode: number) {
        const email = await this.emailRepository.findOneBy({ hospital_code: hospitalCode });
        if (!email) throw new NotFoundException('존재하지 않는 병원입니다.');

        const parts = await this.structureRepository.find({
            where: {
                hospital_code: hospitalCode,
                level: 1,
                is_deleted: 0,
            },
            select: ['hospital_st_code', 'category_name', 'sort_order']
        });

        return {
            hospital_code: Number(hospitalCode),
            hospital_name: email.hospital_name,
            parts: parts.map(part => ({
                hospital_st_code: Number(part.hospital_st_code),
                category_name: part.category_name,
                sort_order: part.sort_order,
            }))
            //parts,
        }
    }

    // GET /hospital/structure/floor?hospital_st_code={hospital_st_code}
    async floorcheck(hospitalStCode: number) {
        const structure = await this.structureRepository.findOneBy({ hospital_st_code: hospitalStCode });
        if (!structure) throw new NotFoundException('존재하지 않는 구조입니다.');

        const floors = await this.structureRepository.find({
            where: {
                parents: { hospital_st_code: hospitalStCode },
                level: 2,
            },
            relations: { parents: true },
            select: { 
                parents: { hospital_st_code: true }, 
                hospital_st_code: true, 
                category_name: true, 
                sort_order: true
            }
        });

        return {
            category_name: structure.category_name,
            floors: floors.map(floor => ({
                parents_code: Number(floor.parents?.hospital_st_code),
                hospital_st_code: Number(floor.hospital_st_code),
                category_name: floor.category_name,
                sort_order: floor.sort_order,
            })),
        };
    }

    // GET /hospital/structure/patient-list?hospital_st_code={hospital_st_code}
    async patientsByFloor(floorCode: number) {
        const floor = await this.structureRepository.findOne({ where: { hospital_st_code: floorCode }});
        if (!floor) throw new NotFoundException('존재하지 않는 층 입니다.');

        const patients = await this.profileRepository
        .createQueryBuilder('patient')                      // bed, room, floor = hospital_structure_info, warn = patient_warning_state
        .leftJoinAndSelect('patient.bedCode', 'bed')        // 침상 hospital_structure_info.hospital_st_code = patient.bed_code
        .leftJoinAndSelect('bed.parents', 'room')           // 침실 hospital_structure_info.hospital_st_code = hospital_structure_info.parents_code
        .leftJoinAndSelect('room.parents', 'floor')         // 층   hospital_structure_info.hospital_st_code = hospital_structure_info.parents_code
        .leftJoinAndSelect('patient.warningState', 'warn')  // 위험상태
        .where('floor.hospital_st_code = :floorCode', { floorCode })
        .andWhere('patient.is_deleted = 0')
        .orderBy('warn.warning_state', 'DESC')
        .addOrderBy('room.category_name', 'ASC')
        .addOrderBy('bed.category_name', 'ASC')
        .getMany();

        return {
            floor_code: floor.hospital_st_code,
            floor_category_name: floor.category_name,
            patients: patients.map(p => ({
                patient_code: Number(p.patient_code),
                patient_name: p.patient_name,
                patient_room: p.bedCode?.parents?.category_name,
                patient_bed: p.bedCode?.category_name,
                patient_warning: p.warningState.warning_state,
            })),
        };
    }

    // GET /hospital/structure?hospital_st_code={hospital_st_code}
    async informationByFloor(floorCode: number) {
        const floor = await this.structureRepository.findOne({ where: { hospital_st_code: floorCode } });
        if (!floor) throw new NotFoundException('존재하지 않는 층 입니다.');

        const rooms = await this.structureRepository.find({
            where: { parents: { hospital_st_code: floorCode } },
            order: { sort_order: 'ASC' }
        });

        const roomCodes = rooms.map(r => r.hospital_st_code);

        const beds = await this.structureRepository.find({
            where: { parents: In(roomCodes) },
            order: { sort_order: 'ASC' },
            relations: ['parents'],
        });

        const bedCodes = beds.map(b => b.hospital_st_code);

        const patients = await this.profileRepository
        .createQueryBuilder('patient')
        .leftJoinAndSelect('patient.warningState', 'warn')
        .leftJoinAndSelect('patient.bedCode', 'bed')
        .where('patient.is_deleted = 0')
        .andWhere('bed.hospital_st_code IN (:...bedCodes)', { bedCodes })
        .getMany();

        const patientMap = new Map<number, any>();

        patients.forEach(p => {
            if (!p.bedCode) return;
            
            patientMap.set(p.bedCode.hospital_st_code, {
                patient_code: p.patient_code,
                patient_name: p.patient_name,
                patient_age: p.age,
                patient_warning: p.warningState.warning_state ?? null,
            });
        });

        const bedMap = new Map<number, any>();

        beds.forEach(b => {
            const roomCode = b.parents?.hospital_st_code;
            if (!roomCode) return;
            
            const patient = patientMap.get(b.hospital_st_code);

            const bedDto = {
                parents_code: roomCode,
                hospital_st_code: b.hospital_st_code,
                category_name: b.category_name,
                sort_order: b.sort_order,
                patient,
            };

            if (!bedMap.has(roomCode)) bedMap.set(roomCode, []);

            bedMap.get(roomCode)!.push(bedDto);
        });

        return {
            floor_code: floor.hospital_st_code,
            floor_category_name: floor.category_name,
            rooms: rooms.map(room => ({
                parents_code: floor.hospital_st_code,
                hospital_st_code: room.hospital_st_code,
                category_name: room.category_name,
                sort_order: room.sort_order,
                beds: bedMap.get(room.hospital_st_code) ?? [],
            })),
        }
    }

    // PUT /hospital/structure/update
    async partUpdate(dto: UpdateStructureDto) {
        const part = await this.structureRepository.findOne({ where: { hospital_st_code: dto.hospital_st_code } });
        if (!part) throw new NotFoundException('존재하지 않는 병동 입니다.');

        part.category_name = dto.category_name;

        const updatePart = await this.structureRepository.save(part);

        return {
            hospital_st_code: updatePart.hospital_st_code,
            category_name: updatePart.category_name,
            level: updatePart.level,
            sort_order: updatePart.sort_order,
            create_at: updatePart.create_at,
            update_at: updatePart.update_at,
            note: updatePart.note,
            description: updatePart.description,
        };
    }

    // DELETE /hospital/structure/delete/:hospital_st_code
    async delete(partCode: number) {
        const part = await this.structureRepository.findOne({ where: { hospital_st_code: partCode } });
        if (!part) throw new NotFoundException('존재하지 않는 병동 입니다.');

        part.is_deleted = 1;

        await this.structureRepository.save(part);
    }
}
