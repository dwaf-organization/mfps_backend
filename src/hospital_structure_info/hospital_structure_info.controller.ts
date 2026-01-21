import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { HospitalStructureInfoService } from './hospital_structure_info.service';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import { CreateStructureDto } from './dto/create-structure.dto';
import { UpdateStructureDto } from './dto/update-structure.dto';

@Controller('hospital')
export class HospitalStructureInfoController {
    constructor (
        private readonly structureService: HospitalStructureInfoService,
    ) {}

    @ResponseMessage('병원구조정보 생성 성공')
    @Post('structure')
    async create(@Body() dto: CreateStructureDto) {
        const structure = await this.structureService.create(dto);

        return structure;
    }

    @ResponseMessage('병원구조정보 층별 조회 성공')
    @Get('structure')
    async informationByFloor(@Query('hospital_st_code') floorCode: number) {
        const info = await this.structureService.informationByFloor(floorCode);

        return info;
    } 

    @ResponseMessage('병원구조정보 병동 조회 성공')
    @Get('structure/part')
    async partcheck(@Query('hospital_code') hospitalCode: number) {
        const parts = await this.structureService.partcheck(hospitalCode);

        return parts;
    }

    @ResponseMessage('병원구조정보 병동별 층 조회 성공')
    @Get('structure/floor')
    async floorcheck(@Query('hospital_st_code') hospitalStCode: number) {
        const floors = await this.structureService.floorcheck(hospitalStCode);

        return floors;
    }

    @ResponseMessage('병원구조정보 층별 환자 목록 조회 성공')
    @Get('structure/patient-list')
    async patientsByFloor(@Query('hospital_st_code') floorCode: number) {
        const patients = await this.structureService.patientsByFloor(floorCode);

        return patients;
    }

    @ResponseMessage('병동이름 수정 성공')
    @Put('structure/update')
    async partUpdate(@Body() dto: UpdateStructureDto) {
        const part = await this.structureService.partUpdate(dto);

        return part;
    }

    @ResponseMessage('병동 삭제 성공')
    @Delete('structure/delete/:hospital_st_code')
    async partDelete(@Param('hospital_st_code') partCode: number) {
        return this.structureService.delete(partCode);
    }
}
