import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { HospitalStructureInfoEntity } from './hospital_structure_info.entity';
import { In, IsNull, Not, Repository, DataSource } from 'typeorm';
import { CreateStructureDto } from './dto/create-structure.dto';
import { HospitalEmailEntity } from 'src/hospital_email/hospital_email.entity';
import { PatientProfileEntity } from 'src/patient_profile/patient_profile.entity';
import { DevicePositionEntity } from 'src/device_position/device_position.entity';
import { UpdateStructureDto } from './dto/update-structure.dto';
import { UpdateStructureOrderDto } from './dto/update-structure-order.dto';
import { UpdateRoomDetailDto } from './dto/update-room-detail.dto';
import { MeasurementEntity } from 'src/measurement/measurement.entity';

@Injectable()
export class HospitalStructureInfoService {
  constructor(
    @InjectRepository(HospitalStructureInfoEntity)
    private readonly structureRepository: Repository<HospitalStructureInfoEntity>,
    @InjectRepository(HospitalEmailEntity)
    private readonly emailRepository: Repository<HospitalEmailEntity>,
    @InjectRepository(PatientProfileEntity)
    private readonly profileRepository: Repository<PatientProfileEntity>,
    private readonly dataSource: DataSource,
  ) {}

  // POST /hospital/structure
  async create(dto: CreateStructureDto) {
    let level = 1;
    let sort_order = 0;
    let parent: HospitalStructureInfoEntity | null = null;

    const hospital = await this.emailRepository.findOneBy({
      hospital_code: dto.hospital_code,
    });
    if (!hospital) throw new NotFoundException('존재하지 않는 병원입니다.');

    if (dto.parents_code) {
      parent = await this.structureRepository.findOne({
        where: { hospital_st_code: dto.parents_code },
      });

      if (!parent)
        throw new NotFoundException('부모 레벨이 존재하지 않습니다.');

      const childCount = await this.structureRepository.count({
        where: {
          parents: { hospital_st_code: parent.hospital_st_code },
        },
      });

      level = parent.level + 1;
      sort_order = childCount + 1;
    } else {
      const partCount = await this.structureRepository.count({
        where: {
          hospitalCode: { hospital_code: dto.hospital_code },
          parents: IsNull(),
        },
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
    };
  }

  // GET /hospital/structure/part?hospital_code{hospital_code}
  async partcheck(hospitalCode: number) {
    const email = await this.emailRepository.findOneBy({
      hospital_code: hospitalCode,
    });
    if (!email) throw new NotFoundException('존재하지 않는 병원입니다.');

    const parts = await this.structureRepository.find({
      where: {
        hospital_code: hospitalCode,
        level: 1,
        is_deleted: 0,
      },
      select: ['hospital_st_code', 'category_name', 'sort_order'],
    });

    return {
      hospital_code: Number(hospitalCode),
      hospital_name: email.hospital_name,
      parts: parts.map((part) => ({
        hospital_st_code: Number(part.hospital_st_code),
        category_name: part.category_name,
        sort_order: part.sort_order,
      })),
    };
  }

  // GET /hospital/structure/floor?hospital_st_code={hospital_st_code}
  async floorcheck(hospitalStCode: number) {
    const structure = await this.structureRepository.findOneBy({
      hospital_st_code: hospitalStCode,
    });
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
        sort_order: true,
      },
      order: { sort_order: 'ASC' },
    });

    return {
      category_name: structure.category_name,
      floors: floors.map((floor) => ({
        parents_code: Number(floor.parents?.hospital_st_code),
        hospital_st_code: Number(floor.hospital_st_code),
        category_name: floor.category_name,
        sort_order: floor.sort_order,
      })),
    };
  }

  // GET /hospital/structure/patient-list?hospital_st_code={hospital_st_code}
  async patientsByFloor(floorCode: number) {
    const floor = await this.structureRepository.findOne({
      where: { hospital_st_code: floorCode },
    });
    if (!floor) throw new NotFoundException('존재하지 않는 층 입니다.');

    const patients = await this.profileRepository
      .createQueryBuilder('patient')
      .leftJoinAndSelect('patient.bedCode', 'bed')
      .leftJoinAndSelect('bed.parents', 'room')
      .leftJoinAndSelect('room.parents', 'floor')
      .leftJoinAndSelect('patient.warningStates', 'warns')
      .leftJoinAndSelect('bed.devicePositions', 'device')
      .where('floor.hospital_st_code = :floorCode', { floorCode })
      .andWhere('patient.is_deleted = 0')
      .orderBy('warns.create_at', 'DESC')
      .addOrderBy('room.category_name', 'ASC')
      .addOrderBy('bed.category_name', 'ASC')
      .getMany();

    return {
      floor_code: floor.hospital_st_code,
      floor_category_name: floor.category_name,
      patients: patients.map((p) => {
        // 해당 침대의 디바이스 정보 가져오기
        const device = p.bedCode?.devicePositions?.[0]; // 1:1 관계라고 가정

        return {
          patient_code: Number(p.patient_code),
          patient_name: p.patient_name,
          patient_room: p.bedCode?.parents?.category_name,
          patient_bed: p.bedCode?.category_name,
          patient_warning: p.warningStates?.[0]?.warning_state ?? 0,
          device_code: device?.device_code ?? null, // 새로 추가
          device_unique_id: device?.device_unique_id ?? null, // 새로 추가
        };
      }),
    };
  }

  // GET /hospital/structure?hospital_st_code={hospital_st_code}
  async informationByFloor(floorCode: number) {
    const floor = await this.structureRepository.findOne({
      where: { hospital_st_code: floorCode },
    });
    if (!floor) throw new NotFoundException('존재하지 않는 층 입니다.');

    const rooms = await this.structureRepository.find({
      where: { parents: { hospital_st_code: floorCode } },
      order: { sort_order: 'ASC' },
    });

    const roomCodes = rooms.map((r) => r.hospital_st_code);

    // 침대 정보 조회 시 디바이스 정보도 함께 가져오기
    const beds = await this.structureRepository.find({
      where: { parents: In(roomCodes) },
      order: { sort_order: 'ASC' },
      relations: ['parents', 'devicePositions'], // 디바이스 관계 추가
    });

    const bedCodes = beds.map((b) => b.hospital_st_code);

    const patients = await this.profileRepository
      .createQueryBuilder('patient')
      .leftJoinAndSelect('patient.warningStates', 'warns')
      .leftJoinAndSelect('patient.bedCode', 'bed')
      .where('patient.is_deleted = 0')
      .andWhere('bed.hospital_st_code IN (:...bedCodes)', { bedCodes })
      .orderBy('warns.create_at', 'DESC')
      .getMany();

    const patientMap = new Map<number, any>();

    patients.forEach((p) => {
      if (!p.bedCode) return;

      patientMap.set(p.bedCode.hospital_st_code, {
        patient_code: p.patient_code,
        patient_name: p.patient_name,
        patient_age: p.age,
        patient_warning: p.warningStates?.[0]?.warning_state ?? 0,
      });
    });

    const bedMap = new Map<number, any>();

    beds.forEach((b) => {
      const roomCode = b.parents?.hospital_st_code;
      if (!roomCode) return;

      const patient = patientMap.get(b.hospital_st_code);

      // 환자 정보에 디바이스 정보 추가
      if (patient) {
        const device = b.devicePositions?.[0]; // 1:1 관계이므로 첫 번째 디바이스
        patient.device_code = device?.device_code ?? null;
        patient.device_unique_id = device?.device_unique_id ?? null;
      }

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
      rooms: rooms.map((room) => ({
        parents_code: floor.hospital_st_code,
        hospital_st_code: room.hospital_st_code,
        category_name: room.category_name,
        sort_order: room.sort_order,
        beds: bedMap.get(room.hospital_st_code) ?? [],
      })),
    };
  }

  // PUT /hospital/structure/update
  async partUpdate(dto: UpdateStructureDto) {
    const part = await this.structureRepository.findOne({
      where: { hospital_st_code: dto.hospital_st_code },
    });
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
    const part = await this.structureRepository.findOne({
      where: { hospital_st_code: partCode },
    });
    if (!part) throw new NotFoundException('존재하지 않는 병동 입니다.');

    part.is_deleted = 1;

    await this.structureRepository.save(part);
  }

  // PUT /hospital/structure/reorder
  async reorder(dto: UpdateStructureOrderDto) {
    const structure = await this.structureRepository.findOne({
      where: { hospital_st_code: dto.hospital_st_code },
      relations: ['parents'],
    });

    if (!structure) {
      throw new NotFoundException('존재하지 않는 구조입니다.');
    }

    // sort_order 변경 시 중복 검사
    if (dto.sort_order && dto.sort_order !== structure.sort_order) {
      // 부모가 있는 경우와 없는 경우를 분리해서 처리
      const whereCondition = structure.parents
        ? {
            parents: { hospital_st_code: structure.parents.hospital_st_code },
            sort_order: dto.sort_order,
            hospital_st_code: Not(dto.hospital_st_code),
          }
        : {
            parents: IsNull(), // null 대신 IsNull() 사용
            sort_order: dto.sort_order,
            hospital_st_code: Not(dto.hospital_st_code),
          };

      const duplicate = await this.structureRepository.findOne({
        where: whereCondition,
      });

      if (duplicate) {
        throw new ConflictException('이미 사용 중인 순서입니다.');
      }
    }

    // 필드 업데이트
    if (dto.category_name) {
      structure.category_name = dto.category_name;
    }

    if (dto.sort_order) {
      structure.sort_order = dto.sort_order;
    }

    const updated = await this.structureRepository.save(structure);

    return {
      hospital_st_code: updated.hospital_st_code,
      category_name: updated.category_name,
      sort_order: updated.sort_order,
      level: updated.level,
      update_at: updated.update_at,
    };
  }

  // DELETE /hospital/structure/floor/:hospital_st_code
  async deleteFloor(floorCode: number) {
    return await this.dataSource.transaction(async (manager) => {
      // 1. 층이 존재하는지 확인
      const floor = await manager.findOne(HospitalStructureInfoEntity, {
        where: { hospital_st_code: floorCode, level: 2 },
      });

      if (!floor) {
        throw new NotFoundException('존재하지 않는 층입니다.');
      }

      // 2. 해당 층의 모든 호실 조회
      const rooms = await manager.find(HospitalStructureInfoEntity, {
        where: {
          parents: { hospital_st_code: floorCode },
          level: 3,
        },
      });

      const roomCodes = rooms.map((r) => r.hospital_st_code);

      // 3. 해당 층의 모든 침대 조회
      const beds = await manager.find(HospitalStructureInfoEntity, {
        where: {
          parents: In(roomCodes),
          level: 4,
        },
      });

      const bedCodes = beds.map((b) => b.hospital_st_code);

      if (bedCodes.length > 0) {
        // 4. 침대에 배정된 환자 확인
        const patientsCount = await manager.count(PatientProfileEntity, {
          where: {
            bedCode: In(bedCodes),
            is_deleted: 0,
          },
        });

        if (patientsCount > 0) {
          throw new ConflictException(
            `해당 층에 ${patientsCount}명의 환자가 배정되어 있습니다. 먼저 환자를 이동시켜주세요.`,
          );
        }

        // 5. 침대에 연결된 디바이스 확인
        const devicesCount = await manager.count(DevicePositionEntity, {
          where: { device_loc_code: In(bedCodes) },
        });

        if (devicesCount > 0) {
          throw new ConflictException(
            `해당 층에 ${devicesCount}개의 디바이스가 연결되어 있습니다. 먼저 디바이스 연결을 해제해주세요.`,
          );
        }

        // 6. 측정 데이터 확인 (침대 기반)
        const measurementsCount = await manager
          .createQueryBuilder(MeasurementEntity, 'measurement')
          .leftJoin(
            PatientProfileEntity,
            'patient',
            'patient.patient_code = measurement.patient_code',
          )
          .where('patient.bedCode IN (:...bedCodes)', { bedCodes })
          .getCount();

        if (measurementsCount > 0) {
          throw new ConflictException(
            `해당 층에 ${measurementsCount}개의 측정 데이터가 있습니다. 데이터를 먼저 정리해주세요.`,
          );
        }
      }

      // 7. 삭제 실행 (순서 중요: 하위 → 상위)
      let deletedCount = 0;

      // 침대 삭제
      if (bedCodes.length > 0) {
        const deletedBeds = await manager.delete(HospitalStructureInfoEntity, {
          hospital_st_code: In(bedCodes),
        });
        deletedCount += deletedBeds.affected || 0;
      }

      // 호실 삭제
      if (roomCodes.length > 0) {
        const deletedRooms = await manager.delete(HospitalStructureInfoEntity, {
          hospital_st_code: In(roomCodes),
        });
        deletedCount += deletedRooms.affected || 0;
      }

      // 층 삭제
      const deletedFloor = await manager.delete(HospitalStructureInfoEntity, {
        hospital_st_code: floorCode,
      });
      deletedCount += deletedFloor.affected || 0;

      return {
        deleted_floor_code: floorCode,
        deleted_floor_name: floor.category_name,
        total_deleted_count: deletedCount,
        deleted_rooms_count: roomCodes.length,
        deleted_beds_count: bedCodes.length,
        message: '층과 모든 하위 구조가 성공적으로 삭제되었습니다.',
      };
    });
  }

  // GET /hospital/structure/room/:room_code
  async getRoomDetail(roomCode: number) {
    // 1. 호실 정보 조회 (level: 3)
    const room = await this.structureRepository.findOne({
      where: {
        hospital_st_code: roomCode,
        level: 3,
      },
    });

    if (!room) {
      throw new NotFoundException('존재하지 않는 호실입니다.');
    }

    // 2. 해당 호실의 침상들 조회 (level: 4, parents_code = roomCode)
    const beds = await this.structureRepository.find({
      where: {
        parents: { hospital_st_code: roomCode },
        level: 4,
      },
      order: { sort_order: 'ASC' }, // 정렬순서 오름차순
    });

    // 3. 응답 데이터 구성
    return {
      room_info: {
        room_name: room.category_name,
        sort_order: room.sort_order,
      },
      beds: beds.map((bed) => ({
        bed_name: bed.category_name,
        sort_order: bed.sort_order,
      })),
    };
  }

  // PUT /hospital/structure/room/update
  async updateRoomDetail(dto: UpdateRoomDetailDto) {
    return await this.dataSource.transaction(async (manager) => {
      try {
        // 1. 호실 존재 확인 및 수정
        const room = await manager.findOne(HospitalStructureInfoEntity, {
          where: {
            hospital_st_code: dto.room_info.hospital_st_code,
            level: 3,
          },
        });

        if (!room) {
          throw new NotFoundException('존재하지 않는 호실입니다.');
        }

        // 호실 정보 수정
        room.category_name = dto.room_info.room_name;
        room.sort_order = dto.room_info.sort_order;
        const updatedRoom = await manager.save(room);

        // 2. 침상 정보 처리
        const processedBeds: any[] = [];

        if (dto.beds && dto.beds.length > 0) {
          for (const bedDto of dto.beds) {
            if (bedDto.hospital_st_code) {
              // 기존 침상 수정
              const existingBed = await manager.findOne(
                HospitalStructureInfoEntity,
                {
                  where: {
                    hospital_st_code: bedDto.hospital_st_code,
                    level: 4,
                  },
                },
              );

              if (!existingBed) {
                throw new NotFoundException(
                  `침상 코드 ${bedDto.hospital_st_code}를 찾을 수 없습니다.`,
                );
              }

              // 침상 정보 수정
              existingBed.category_name = bedDto.bed_name;
              existingBed.sort_order = bedDto.sort_order;
              const updatedBed = await manager.save(existingBed);

              processedBeds.push({
                hospital_st_code: updatedBed.hospital_st_code,
                bed_name: updatedBed.category_name,
                sort_order: updatedBed.sort_order,
                action: 'updated',
              });
            } else {
              // 새 침상 생성
              const newBed = manager.create(HospitalStructureInfoEntity, {
                hospital_code: room.hospital_code,
                category_name: bedDto.bed_name,
                level: 4,
                parents: room,
                sort_order: bedDto.sort_order,
              });

              const savedBed = await manager.save(newBed);

              processedBeds.push({
                hospital_st_code: savedBed.hospital_st_code,
                bed_name: savedBed.category_name,
                sort_order: savedBed.sort_order,
                action: 'created',
              });
            }
          }
        }

        // 3. 응답 데이터 구성
        const response = {
          room_info: {
            hospital_st_code: updatedRoom.hospital_st_code,
            room_name: updatedRoom.category_name,
            sort_order: updatedRoom.sort_order,
            action: 'updated',
          },
          beds: processedBeds,
          summary: {
            room_updated: 1,
            beds_updated: processedBeds.filter((b) => b.action === 'updated')
              .length,
            beds_created: processedBeds.filter((b) => b.action === 'created')
              .length,
          },
        };

        return response;
      } catch (error) {
        throw error;
      }
    });
  }
}
