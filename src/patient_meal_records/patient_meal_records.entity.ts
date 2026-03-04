import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('patient_meal_records')
export class PatientMealRecordsEntity {
  @PrimaryGeneratedColumn()
  meal_record_code: number;

  @Column()
  patient_code: number;

  @Column({ type: 'date' })
  record_date: Date;

  @Column()
  meal_type_code: number;

  @Column()
  intake_level_code: number;

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
