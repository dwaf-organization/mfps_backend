import { PatientProfileEntity } from "src/patient_profile/patient_profile.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('patient_warning_state')
export class PatientWarningStateEntity {

    @PrimaryGeneratedColumn({ type: 'int' })
    patient_status_code: number;

    @Column({ type: 'bigint' })
    patient_code: number;

    @ManyToOne(() => PatientProfileEntity, patient => patient.warningStates)
    @JoinColumn({ name: 'patient_code' })
    patientProfile: PatientProfileEntity;

    @Column({ type: 'tinyint', default: 0 })
    warning_state: number;

    @Column({ type: 'datetime', nullable: true })  // nullable 명시
    last_change_at: Date | null;

    @CreateDateColumn()
    create_at: Date;

    @UpdateDateColumn()
    update_at: Date;

    @Column({ type: 'varchar', length: 255, nullable: true })
    description: string;
}