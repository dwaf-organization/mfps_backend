import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { PatientProfileService } from './patient_profile.service';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('patient')
export class PatientProfileController {
    constructor (
        private readonly profileService: PatientProfileService,
    ) {}

    @ResponseMessage('환자정보 생성 성공')
    @Post('profile')
    async create(@Body() dto: CreateProfileDto) {
        const patient = await this.profileService.create(dto);

        return patient;
    }

    @ResponseMessage('환자정보 조회 성공')
    @Get('profile')
    async find(@Query('patient_code') patientCode: number) {
        const patient = await this.profileService.findOne(patientCode);

        return patient;
    }

    @ResponseMessage('환자정보 수정 성공')
    @Put('profile/update')
    async update(@Body() dto: UpdateProfileDto) {
        const patient = await this.profileService.update(dto);

        return patient;
    }

    @ResponseMessage('환자정보 삭제 성공')
    @Delete('profile/delete/:patient_code')
    async delete(@Param('patient_code') patientCode: number) {
        return this.profileService.delete(patientCode);
    }

    @ResponseMessage('등록 가능한 침대 조회 성공')
    @Get('profile/empty-bed')
    async findEmptyBed(@Query('hospital_st_code') floorCode: number) {
        return this.profileService.findEmptyBed(floorCode);
    }
}
