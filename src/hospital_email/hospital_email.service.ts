import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HospitalEmailEntity } from './hospital_email.entity';
import { LoginEmailDto } from './dto/login-email.dto';
import { CreateEmailDto } from './dto/create-email.dto';
import * as bcrypt from 'node_modules/bcryptjs';
import { UpdateEmailDto } from './dto/update-mail.dto';

@Injectable()
export class HospitalEmailService {
    constructor (
        @InjectRepository(HospitalEmailEntity)
        private readonly emailRepository: Repository<HospitalEmailEntity>
    ) {}

    // POST /auth/register
    async register(dto: CreateEmailDto) {
        const email = await this.emailRepository.findOne({ where: { hospital_id: dto.hospital_id } });
        if (email) throw new ConflictException('이미 존재하는 이메일 입니다.');

        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(dto.hospital_password, salt);

        const newEmail = this.emailRepository.create({
            hospital_id: dto.hospital_id,
            hospital_password: hashedPassword,
            hospital_name: dto.hospital_name,
            note: dto.note,
            description: dto.description,
        });
        await this.emailRepository.save(newEmail);

        return {
            hospital_code: newEmail.hospital_code,
            hospital_id: newEmail.hospital_id,
            hospital_name: newEmail.hospital_name,
        };
    }
    
    // POST /auth/login
    async login(dto: LoginEmailDto) {
        const email = await this.emailRepository.findOne({ 
            where: {
            hospital_id: dto.hospital_id,
            is_deleted: 0,
            }
        });

        if (!email) throw new UnauthorizedException('로그인 실패, 아이디나 비밀번호를 확인해 주세요');

        const isMatch = await bcrypt.compare(dto.hospital_password, email.hospital_password);

        if (!isMatch) throw new UnauthorizedException('로그인 실패, 아이디나 비밀번호를 확인해 주세요');

        return {
            hospital_code: email.hospital_code,
            hospital_id: email.hospital_id,
            hospital_name: email.hospital_name,
        }
    }

    // PUT /auth/email/update
    async update(hospitalCode: number, dto: UpdateEmailDto) {
        if (dto.hospital_new_password !== dto.hospital_new_password_verify)
            throw new BadRequestException('비밀번호가 다릅니다.');
        
        const email = await this.emailRepository.findOneBy({ hospital_code: hospitalCode });
        if (!email) throw new NotFoundException('존재하지 않는 회원입니다.');

        const salt = await bcrypt.genSalt();
        const newHashedPassword = await bcrypt.hash(dto.hospital_new_password, salt);
        
        email.hospital_password = newHashedPassword;

        const updateEmail = await this.emailRepository.save(email);

        return {
            hospital_code: updateEmail.hospital_code,
            hospital_id: updateEmail.hospital_id,
            hospital_name: updateEmail.hospital_name,
            update_at: updateEmail.update_at,
        }
    }

    // GET /auth/email
    async findAll() {
        return this.emailRepository.find({
            select: ['hospital_code', 'hospital_id', 'hospital_name', 'create_at', 'update_at', 'note']
        });
    }

    // GET /auth/email?hospital_code={hospital_code}
    async findOne(hospitalCode: number) {
        const email = await this.emailRepository.findOne({ where: { hospital_code: hospitalCode } })
        if (!email) throw new NotFoundException('존재하지 않는 병원입니다.');

        return {
            hospital_code: email.hospital_code,
            hospital_id: email.hospital_id,
            hospital_name: email.hospital_name,
            create_at: email.create_at,
            update_at: email.update_at,
            note: email.note,
        }
    }

    // DELETE /auth/email/delete/:hospital_code
    async delete(hospitalCode: number) {
        const email = await this.emailRepository.findOneBy({ hospital_code: hospitalCode });
        if (!email) throw new NotFoundException('존재하지 않는 병원입니다.');

        email.is_deleted = 1;
        
        await this.emailRepository.save(email);
    }
}
