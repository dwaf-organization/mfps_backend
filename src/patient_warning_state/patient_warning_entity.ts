import { PatientProfileEntity } from "src/patient_profile/patient_profile.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryColumn, UpdateDateColumn } from "typeorm";

@Entity('patient_warning_state')
export class PatientWarningStateEntity {

    @PrimaryColumn({ type: 'bigint' })
    patient_code: number;

    @OneToOne(() => PatientProfileEntity, patient => patient.warningState)
    @JoinColumn({ name: 'patient_code' })
    patientProfile: PatientProfileEntity;

    @Column({ type: 'tinyint', default: 0 })
    warning_state: number;

    @Column({ type: 'datetime', nullable: true })
    last_change_at: Date;

    @CreateDateColumn()
    create_at: Date;

    @UpdateDateColumn()
    update_at: Date;

    @Column({ nullable: true })
    description: string;
}