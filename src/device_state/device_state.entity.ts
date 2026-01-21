import { DevicePositionEntity } from "src/device_position/device_position.entity";
import { MeasurementEntity } from "src/measurement/measurement.entity";
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToOne, OneToMany } from "typeorm";

@Entity('device_state')
export class DeviceStateEntity {
    
    @PrimaryGeneratedColumn({ type: 'bigint' })
    device_code: number;

    @OneToOne(() => DevicePositionEntity, pos => pos.deviceState)
    position: DevicePositionEntity;

    @OneToMany(() => MeasurementEntity, measure => measure.deviceState)
    measurements: MeasurementEntity[];

    @Column({ type: 'tinyint', default: 0 })
    is_active: number;

    @Column({ nullable: true })
    last_seen_at: Date;

    @CreateDateColumn()
    create_at: Date;

    @UpdateDateColumn()
    update_at: Date;

    @Column({ nullable: true })
    note: string;

    @Column({ nullable: true })
    description: string;
}