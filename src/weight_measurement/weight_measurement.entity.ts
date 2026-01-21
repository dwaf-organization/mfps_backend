import { MeasurementEntity } from "src/measurement/measurement.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";

@Entity('weight_measurement')
export class WeightMeasurementEntity {

    @PrimaryColumn({ type: 'bigint' })
    measurement_code: number;

    @ManyToOne(() => MeasurementEntity, measure => measure.weights)
    @JoinColumn({ name: 'measurement_code' })
    measurementCode: MeasurementEntity;

    @PrimaryColumn({ type: 'tinyint' })
    sensor_index: number;
    
    @Column({ type: 'bigint' })
    value: number;

    @Column({ nullable: true})
    description: string;    
}