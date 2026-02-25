import { DeviceStateEntity } from "src/device_state/device_state.entity";
import { PatientProfileEntity } from "src/patient_profile/patient_profile.entity";
import { WeightMeasurementEntity } from "src/weight_measurement/weight_measurement.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('measurement')
export class MeasurementEntity {

    @PrimaryGeneratedColumn({ type: 'bigint' })
    measurement_code: number;

    @OneToMany(() => WeightMeasurementEntity, weight => weight.measurementCode)
    weights: WeightMeasurementEntity[];   

    @Column({ type: 'bigint', nullable: true })
    device_code: number;

    @Column({ type: 'bigint', nullable: true })
    patient_code: number;

    @ManyToOne(() => DeviceStateEntity, state => state.measurements)
    @JoinColumn({ name: 'device_code' })
    deviceState?: DeviceStateEntity;

    @ManyToOne(() => PatientProfileEntity, patient => patient.measurements)
    @JoinColumn({ name: 'patient_code' })
    patientCode?: PatientProfileEntity;

    @Column({ type: 'float', nullable: true })
    temperature: number | null;  // ← null 허용

    @Column({ type: 'float', nullable: true })
    body_temperature: number | null;  // ← null 허용

    @Column({ type: 'tinyint', nullable: true })
    humidity: number | null;  // ← null 허용
    
    @Column({ type: 'datetime' })
    create_at: Date;

    @Column({ type: 'varchar', length: 255, nullable: true })
    description: string | null;  // ← null 허용
}