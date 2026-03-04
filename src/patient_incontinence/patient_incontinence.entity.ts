import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('patient_incontinence')
export class PatientIncontinenceEntity {
  @PrimaryGeneratedColumn()
  incontinence_code: number;

  @Column()
  patient_code: number;

  @Column({ type: 'date' })
  record_date: Date;

  @Column({ type: 'boolean' })
  has_incontinence: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;
}
