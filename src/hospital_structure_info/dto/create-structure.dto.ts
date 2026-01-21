import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateStructureDto {
    @IsInt()
    @Type(() => Number)
    @IsNotEmpty()
    hospital_code: number;

    @IsString()
    @IsNotEmpty()
    category_name: string;

    @IsInt()
    @Type(() => Number)
    @IsOptional()
    level?: number;
    
    @IsInt()
    @Type(() => Number)
    @IsOptional()
    parents_code?: number;

    @IsString()
    @IsOptional()
    note?: string

    @IsString()
    @IsOptional()
    description?: string
}