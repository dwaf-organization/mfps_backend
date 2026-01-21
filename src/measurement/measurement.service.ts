import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MeasurementEntity } from './measurement.entity';
import { LessThan, Repository } from 'typeorm';
import { CreateMeasurementDto } from './dto/create-measurement.dto';
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

    // GET /measurement/basic?device_code={device_code}&patient_code={patient_code}&measurement_code={cursor}
    async find(deviceCode: number, patientCode: number, cursor?: number) {

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
