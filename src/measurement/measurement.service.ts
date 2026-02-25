import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MeasurementEntity } from './measurement.entity';
import { LessThan, Repository } from 'typeorm';
import { CreateMeasurementDto } from './dto/create-measurement.dto';
import { CreateCsvMeasurementDto } from './dto/create-csv-measurement.dto';
import { DataSource } from 'typeorm';
import { DeviceStateEntity } from 'src/device_state/device_state.entity';
import { PatientProfileEntity } from 'src/patient_profile/patient_profile.entity';
import { WeightMeasurementEntity } from 'src/weight_measurement/weight_measurement.entity';

@Injectable()
export class MeasurementService {
    constructor (
        @InjectRepository(MeasurementEntity)
        private readonly measureRepository: Repository<MeasurementEntity>,

        private readonly dataSource: DataSource,
    ) {}

    // POST /measurement/basic (새 CSV 방식)
    async createFromCsv(dto: CreateCsvMeasurementDto) {
        return await this.dataSource.transaction(async manager => {
            
            // 디바이스 존재 확인
            const device = await manager.findOne(DeviceStateEntity, {
                where: { device_code: dto.device_code },
                relations: ['position'],
            });
            if (!device) throw new NotFoundException('존재하지 않는 디바이스 입니다.');

            // 환자 존재 확인
            const patient = await manager.findOne(PatientProfileEntity, {
                where: { 
                    patient_code: dto.patient_code,
                    is_deleted: 0 
                }
            });
            if (!patient) throw new NotFoundException('존재하지 않는 환자입니다.');

            const results: any[] = [];

            // CSV 데이터 파싱 및 저장
            for (const csvLine of dto.data) {
                try {
                    // CSV 파싱: 온도,습도,체온,무게1,무게2,무게3,무게4,측정시간
                    const values = csvLine.split(',');
                    
                    if (values.length !== 8) {
                        throw new Error(`잘못된 CSV 형식: ${csvLine}`);
                    }

                    const temperature = parseFloat(values[0]);
                    const humidity = parseInt(values[1]);
                    const bodyTemperature = parseFloat(values[2]);
                    const weight1 = parseFloat(values[3]);
                    const weight2 = parseFloat(values[4]);
                    const weight3 = parseFloat(values[5]);
                    const weight4 = parseFloat(values[6]);
                    const measurementTime = new Date(values[7]);

                    // measurement 생성 (타입 안전하게)
                    const measurement = new MeasurementEntity();
                    measurement.device_code = device.device_code;
                    measurement.patient_code = patient.patient_code;
                    measurement.deviceState = device;
                    measurement.patientCode = patient;
                    measurement.temperature = isNaN(temperature) ? null : temperature;
                    measurement.body_temperature = isNaN(bodyTemperature) ? null : bodyTemperature;
                    measurement.humidity = isNaN(humidity) ? null : humidity;
                    measurement.create_at = measurementTime;

                    const saved = await manager.save(measurement);

                    // 체중 센서 데이터 저장 (타입 명시)
                    const weightEntities: WeightMeasurementEntity[] = [];
                    const weights = [weight1, weight2, weight3, weight4];
                    
                    for (let i = 0; i < weights.length; i++) {
                        if (!isNaN(weights[i])) {
                            const weightEntity = new WeightMeasurementEntity();
                            weightEntity.measurementCode = saved;
                            weightEntity.sensor_index = i + 1;
                            weightEntity.value = weights[i];
                            
                            weightEntities.push(weightEntity);
                        }
                    }

                    if (weightEntities.length > 0) {
                        await manager.save(weightEntities);
                    }

                    // 응답 데이터 구성
                    results.push({
                        measurement_code: saved.measurement_code,
                        device_code: saved.device_code,
                        patient_code: saved.patient_code,
                        temperature: saved.temperature,
                        body_temperature: saved.body_temperature,
                        humidity: saved.humidity,
                        weights: weightEntities.map(w => ({
                            sensor: w.sensor_index,
                            value: w.value,
                        })),
                        create_at: saved.create_at,
                        description: saved.description ?? null,
                    });

                } catch (error) {
                    console.error(`CSV 파싱 오류: ${csvLine}`, error);
                    throw new Error(`CSV 데이터 파싱 실패: ${csvLine}`);
                }
            }

            // 디바이스 마지막 접속 시간 업데이트
            device.last_seen_at = new Date();
            await manager.save(device);

            return results;
        });
    }

    // POST /measurement/basic
    async create(dto: CreateMeasurementDto) {
        return await this.dataSource.transaction(async manager => {

            const device = await manager.findOne(DeviceStateEntity, {
                where: { device_code: dto.device_code },
                relations: ['position'],
            });
            if (!device) throw new NotFoundException('존재하지 않는 디바이스 입니다.');

            const bedCode = device.position?.device_loc_code;
            if (!bedCode) throw new NotFoundException('설치되지 않은 디바이스 입니다.');

            const patient = await manager.findOne(PatientProfileEntity, {
                where: { 
                    bedCode: { hospital_st_code: bedCode },
                    is_deleted: 0,
                },
                relations: ['bedCode'],
            });
            if (!patient) throw new NotFoundException('침상에 배정된 환자가 없습니다.');

            const lastMeasurement = await manager.findOne(MeasurementEntity, {
                where: { 
                    deviceState: { device_code: dto.device_code },
                    patientCode: { patient_code: patient.patient_code},
                 },
                order: { create_at: 'DESC' },
            });

            let baseTime = lastMeasurement
                ? new Date(lastMeasurement.create_at)
                : new Date(Date.now() - dto.measurements.length * 60_000);

            const results: any[] = [];

            for (let i = 0; i < dto.measurements.length; i++) {
                baseTime = new Date(baseTime.getTime() + 60_000);

                const m = dto.measurements[i];

                const measurement = manager.create(MeasurementEntity, {
                    deviceState: device,
                    patientCode: patient,
                    temperature: m.temperature,
                    body_temperature: m.body_temperature,
                    humidity: m.humidity,
                    create_at: baseTime,
                });

                const saved = await manager.save(measurement);

                const weightEntities = m.weights.map(w => 
                    manager.create(WeightMeasurementEntity, {
                        measurementCode: saved,
                        sensor_index: w.sensor,
                        value: w.value,
                    }),
                );

                await manager.save(weightEntities);

                results.push({
                    measurement_code: saved.measurement_code,
                    device_code: device.device_code,
                    patient_code: patient.patient_code,
                    temperature: saved.temperature,
                    body_temperature: saved.body_temperature,
                    humidity: saved.humidity,
                    weights: weightEntities.map(w => ({
                        sensor: w.sensor_index,
                        value: w.value,
                    })),
                    create_at: saved.create_at,
                    description: saved.description ?? null,
                });
            }

            device.last_seen_at = new Date();
            await manager.save(device);

            return results;
        });
    }

    // GET /measurement/basic?patient_code={patient_code}
    async findLatest(patientCode: number) {
        // 환자가 존재하는지 확인
        const patient = await this.dataSource.manager.findOne(PatientProfileEntity, {
            where: { patient_code: patientCode, is_deleted: 0 }
        });

        if (!patient) {
            throw new NotFoundException('존재하지 않는 환자입니다.');
        }

        // 해당 환자의 최신 측정 데이터 조회 (체중 데이터 포함)
        const latestMeasurement = await this.measureRepository
            .createQueryBuilder('measurement')
            .leftJoinAndSelect('measurement.weights', 'weight')
            .leftJoinAndSelect('measurement.deviceState', 'device')
            .where('measurement.patientCode = :patientCode', { patientCode })
            .orderBy('measurement.create_at', 'DESC')
            .getOne();

        if (!latestMeasurement) {
            throw new NotFoundException('측정 데이터가 없습니다.');
        }

        // 응답 데이터 구성
        return {
            measurement_code: latestMeasurement.measurement_code,
            patient_code: patientCode,
            device_code: latestMeasurement.deviceState?.device_code || null,
            temperature: latestMeasurement.temperature,
            body_temperature: latestMeasurement.body_temperature,
            humidity: latestMeasurement.humidity,
            weights: latestMeasurement.weights?.map(w => ({
                sensor: w.sensor_index,
                value: w.value,
            })) || [],
            create_at: latestMeasurement.create_at,
            description: latestMeasurement.description,
        };
    }

    // GET /measurement/basic/chart?patient_code={patient_code}
    async getChartData(patientCode: number) {
        // 환자가 존재하는지 확인
        const patient = await this.dataSource.manager.findOne(PatientProfileEntity, {
            where: { patient_code: patientCode, is_deleted: 0 }
        });

        if (!patient) {
            throw new NotFoundException('존재하지 않는 환자입니다.');
        }

        // 최신 60개 측정 데이터 조회 (최신부터)
        const recentMeasurements = await this.measureRepository.find({
            where: { patient_code: patientCode },
            order: { create_at: 'DESC' }, // 최신부터 가져오기
            take: 60, // 60개만 가져오기 (20개 * 3)
        });

        if (!recentMeasurements.length) {
            throw new NotFoundException('측정 데이터가 없습니다.');
        }

        // 배열 뒤집기 (오래된 것부터 정렬)
        const oldestFirst = recentMeasurements.reverse();

        // 3개마다 1개씩 샘플링 (0, 3, 6, 9, 12...)
        const sampledMeasurements: MeasurementEntity[] = [];
        for (let i = 0; i < oldestFirst.length; i += 3) {
            sampledMeasurements.push(oldestFirst[i]);
            
            // 최대 20개까지만
            if (sampledMeasurements.length >= 20) {
                break;
            }
        }

        // 차트 데이터 구성
        const temperatureData: { value: number; timestamp: string }[] = [];
        const humidityData: { value: number; timestamp: string }[] = [];
        const bodyTemperatureData: { value: number; timestamp: string }[] = [];

        sampledMeasurements.forEach(measurement => {
            // timestamp 포맷: YYYYMMDDTHH:mm
            const date = measurement.create_at;
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            
            const timestamp = `${year}${month}${day}T${hours}:${minutes}`;

            // null 값을 0으로 변환
            temperatureData.push({
                value: measurement.temperature ?? 0,
                timestamp: timestamp
            });

            humidityData.push({
                value: measurement.humidity ?? 0,
                timestamp: timestamp
            });

            bodyTemperatureData.push({
                value: measurement.body_temperature ?? 0,
                timestamp: timestamp
            });
        });

        return {
            temperature: temperatureData,
            humidity: humidityData,
            body_temperature: bodyTemperatureData,
        };
    }

    // 기존 복잡한 find 메서드는 제거하거나 다른 이름으로 변경
    async findWithPagination(deviceCode: number, patientCode: number, cursor?: number) {
        // 기존 복잡한 로직 (필요시 사용)
        const where: any = {
            deviceState: { device_code: deviceCode },
            patientCode: { patient_code: patientCode },
        };

        if (cursor) where.measurement_code = LessThan(cursor);

        const measurements = await this.measureRepository.find({
            where,
            order: { create_at: 'DESC' },
            take: 300,
        });

        if (!measurements.length) throw new NotFoundException('측정 데이터가 없습니다.');

        const sorted = [...measurements].reverse();

        const result: {
            device_code: number;
            patient_code: number;
            temperature: number;
            body_temperature: number;
            humidity: number;
            create_at: Date;
            }[] = [];

        for (let i = 0; i < sorted.length; i += 10) {
            const chunk = sorted.slice(i, i + 10);
            if (chunk.length < 10) break;

            const avgTemperature = chunk.reduce((sum, m) => sum + (m.temperature ?? 0), 0) / 10;
            const avgBodyTemperature = chunk.reduce((sum, m) => sum + (m.body_temperature ?? 0), 0) / 10;
            const avgHumidity = chunk.reduce((sum, m) => sum + (m.humidity ?? 0), 0) / 10;

            result.push({
                device_code: deviceCode,
                patient_code: patientCode,
                temperature: Number(avgTemperature.toFixed(2)),
                body_temperature: Number(avgBodyTemperature.toFixed(2)),
                humidity: Math.round(avgHumidity),
                create_at: chunk[chunk.length - 1].create_at,
            });
        }

        const nextCursor = measurements.length === 300 ? measurements[measurements.length - 1].measurement_code : null;

        return {
            cursor: nextCursor,
            result
        }
    }
}