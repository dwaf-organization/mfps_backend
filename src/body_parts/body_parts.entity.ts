import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('body_parts')
export class BodyPartsEntity {
  @PrimaryGeneratedColumn()
  part_code: number;

  @Column({ length: 50 })
  part_name: string;

  @Column({ length: 10 })
  part_alias: string;

  @Column()
  sort_order: number;
}
