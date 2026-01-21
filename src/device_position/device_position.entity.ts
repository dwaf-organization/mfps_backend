import { DeviceStateEntity } from "src/device_state/device_state.entity";
import { HospitalStructureInfoEntity } from "src/hospital_structure_info/hospital_structure_info.entity";
import { Entity, PrimaryColumn, Column, JoinColumn, OneToOne, ManyToOne } from "typeorm";

@Entity('device_position')
export class DevicePositionEntity {

    @PrimaryColumn({ type: 'bigint' })
    device_code: number;

    @OneToOne(() => DeviceStateEntity, state => state.position)
    @JoinColumn({ name: 'device_code' })
    deviceState: DeviceStateEntity;

    @Column({ type: 'bigint' })
    device_loc_code: number;

    @ManyToOne(() => HospitalStructureInfoEntity, structure => structure.devicePositions)
    @JoinColumn({ name: 'device_loc_code' })
    location: HospitalStructureInfoEntity;

    @Column({ nullable: true })
    description: string;
}