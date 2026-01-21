import { HospitalStructureInfoEntity } from "src/hospital_structure_info/hospital_structure_info.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn, } from "typeorm";

@Entity('hospital_email')
export class HospitalEmailEntity {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    hospital_code: number;

    @OneToMany(() => HospitalStructureInfoEntity, structure => structure.hospitalCode)
    structures: HospitalStructureInfoEntity[];

    @Column()
    hospital_id: string;

    @Column()
    hospital_password: string;

    @Column()
    hospital_name: string;

    @CreateDateColumn()
    create_at: Date;

    @UpdateDateColumn()
    update_at: Date;

    @Column({ nullable: true })
    note: string;

    @Column({ nullable: true })
    description: string;

    @Column({ type: 'tinyint', default: 0 })
    is_deleted: number;
}