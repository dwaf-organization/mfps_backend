import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PatientProfileEntity } from 'src/patient_profile/patient_profile.entity';
import { BodyPartsEntity } from 'src/body_parts/body_parts.entity';

@Entity('patient_ulcer_history')
export class PatientUlcerHistoryEntity {
  @PrimaryGeneratedColumn()
  history_code: number;

  @Column()
  patient_code: number;

  @Column()
  part_code: number;

  @Column()
  stage_code: number;

  @Column({ type: 'date' })
  record_date: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}
