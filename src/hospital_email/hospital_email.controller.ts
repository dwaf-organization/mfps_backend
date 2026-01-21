import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { HospitalEmailService } from './hospital_email.service';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import { CreateEmailDto } from './dto/create-email.dto';
import { LoginEmailDto } from './dto/login-email.dto';
import { UpdateEmailDto } from './dto/update-mail.dto';
import { SessionAuthGuard } from 'src/common/guards/session-auth.guard';

@Controller('auth')
export class HospitalEmailController {
    constructor(
        private readonly hospitalEmailService: HospitalEmailService,
    ) {}

    @ResponseMessage('아이디 생성 성공')
    @Post('register')
    async register(@Body() dto: CreateEmailDto) {
        const email = await this.hospitalEmailService.register(dto);

        return email;
    }

    @ResponseMessage('로그인 성공')
    @Post('login')
    async login(@Req() req, @Body() dto: LoginEmailDto) {
        const email = await this.hospitalEmailService.login(dto);

        req.session.email = {
            hospital_code: email.hospital_code,
            hospital_id: email.hospital_id,
        };

        return email;
    }

    @ResponseMessage('비밀번호 변경 성공')
    @UseGuards(SessionAuthGuard)
    @Put('email/update')
    async update(@Req() req, @Body() dto: UpdateEmailDto) {
        const hospitalCode = req.session.email.hospital_code;

        const updateEmail = await this.hospitalEmailService.update(hospitalCode, dto);

        return updateEmail;
    }

    @ResponseMessage('병원조회 성공')
    @Get('email')
    async find(@Query('hospital_code') hospitalCode?: string) {
        if (!hospitalCode) return this.hospitalEmailService.findAll();

        return this.hospitalEmailService.findOne(Number(hospitalCode));
    }

    @ResponseMessage('병원정보 삭제 성공')
    @Delete('email/delete/:hospital_code')
    async delete(@Param('hospital_code') hospitalCode: number) {
        return this.hospitalEmailService.delete(hospitalCode);
    }
}
