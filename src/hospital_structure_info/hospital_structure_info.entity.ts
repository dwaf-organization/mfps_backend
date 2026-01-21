import { DevicePositionEntity } from "src/device_position/device_position.entity";
import { HospitalEmailEntity } from "src/hospital_email/hospital_email.entity";
import { PatientBedHistoryEntity } from "src/patient_bed_history/patient_bed_history.entity";
import { PatientProfileEntity } from "src/patient_profile/patient_profile.entity";
import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, OneToOne } from "typeorm";

@Entity('hospital_structure_info')
export class HospitalStructureInfoEntity {

    @PrimaryGeneratedColumn({ type: 'bigint' })
    hospital_st_code: number;

    @OneToMany(() => DevicePositionEntity, position => position.location)
    devicePositions: DevicePositionEntity[];

    @OneToMany(() => PatientProfileEntity, patient => patient.bedCode)
    patients: PatientProfileEntity[];

    @OneToMany(() => PatientBedHistoryEntity, history => history.fromBedCode)
    fromBedHistory: PatientBedHistoryEntity;
    
    @OneToMany(() => PatientBedHistoryEntity, history => history.toBedCode)
    toBedHistory: PatientBedHistoryEntity;

    @OneToMany(() => HospitalStructureInfoEntity, child => child.parents)
    children: HospitalStructureInfoEntity[];

    @Column({ type: 'bigint' })
    hospital_code: number;

    @ManyToOne(() => HospitalEmailEntity, email => email.structures)
    @JoinColumn({ name: 'hospital_code' })
    hospitalCode: HospitalEmailEntity;

    @Column()
    category_name: string;

    @ManyToOne(() => HospitalStructureInfoEntity, parent => parent.children, { nullable: true })
    @JoinColumn({ name: 'parents_code' })
    parents?: HospitalStructureInfoEntity;
    
    @Column({ type: 'tinyint' })
    level: number;

    @Column({ type: 'tinyint' })
    sort_order: number;

    @CreateDateColumn()
    create_at: Date;

    @UpdateDateColumn()
    update_at: Date;

    @Column({ nullable: true })
    note: string;

    @Column({ nullable: true})
    description: string;

    @Column({ type: 'tinyint', default: 0 })
    is_deleted: number;
}