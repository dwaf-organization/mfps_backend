import { DeviceStateEntity } from "src/device_state/device_state.entity";
import { PatientProfileEntity } from "src/patient_profile/patient_profile.entity";
import { WeightMeasurementEntity } from "src/weight_measurement/weight_measurement.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('measurement')
export class MeasurementEntity {

    @PrimaryGeneratedColumn({ type: 'bigint' })
    measurement_code: number;

    @OneToMany(() => WeightMeasurementEntity, weight => weight.measurementCode)
    weights: WeightMeasurementEntity[];   

    @ManyToOne(() => DeviceStateEntity, state => state.measurements)
    @JoinColumn({ name: 'device_code' })
    deviceState: DeviceStateEntity;

    @ManyToOne(() => PatientProfileEntity, patient => patient.measurements)
    @JoinColumn({ name: 'patient_code' })
    patientCode: PatientProfileEntity;

    @Column({ type: 'float', nullable: true })
    temperature: number;

    @Column({ type: 'float', nullable: true })
    body_temperature: number;

    @Column({ type: 'tinyint', nullable: true})
    humidity: number;
    
    @Column({ type: 'datetime' })
    create_at: Date;

    @Column({ nullable: true })
    description: string;
}