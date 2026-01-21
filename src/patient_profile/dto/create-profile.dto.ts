import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateProfileDto {
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
    @IsNotEmpty()
    nurse: string;

    @IsString()
    @IsNotEmpty()
    doctor: string;
    
    @IsString()
    @IsNotEmpty()
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