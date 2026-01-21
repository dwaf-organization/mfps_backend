import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UpdateProfileDto {
    @IsInt()
    @Type(() => Number)
    @IsNotEmpty()
    patient_code: number;

    @IsString()
    @IsNotEmpty()
    patient_name: string;

    @IsInt()
    @Type(() => Number)
    @IsNotEmpty()
    gender: number;

    @IsInt()
    @Type(() => Number)
    @IsNotEmpty()
    age: number;

    @IsString()
    @IsNotEmpty()
    birth_date: string;

    @IsInt()
    @Type(() => Number)
    @IsNotEmpty()
    bed_code: number;

    @IsString()
    @IsOptional()
    nurse: string;

    @IsString()
    @IsOptional()
    doctor: string;

    @IsString()
    @IsOptional()
    diagnosis: string;

    @IsString()
    @IsOptional()
    allergy?: string;

    @IsString()
    @IsOptional()
    significant?: string;

    @IsString()
    @IsOptional()
    note?: string;

    @IsString()
    @IsOptional()
    description?: string;
}