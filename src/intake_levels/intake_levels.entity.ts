import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('intake_levels')
export class IntakeLevelsEntity {
  @PrimaryGeneratedColumn()
  level_code: number;

  @Column({ length: 30 })
  level_name: string;

  @Column()
  percentage_value: number;

  @Column()
  level_order: number;
}
