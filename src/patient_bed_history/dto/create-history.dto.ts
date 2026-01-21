import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateHistoryDto {
    @IsInt()
    @Type(() => Number)
    @IsNotEmpty()
    patient_code: number;

    @IsInt()
    @Type(() => Number)
    @IsNotEmpty()
    from_bed_code?: number | null;

    @IsInt()
    @Type(() => Number)
    @IsNotEmpty()
    to_bed_code?: number | null;

    @IsString()
    @IsOptional()
    moved_reason?: string;

    @IsString()
    @IsOptional()
    note?: string;

    @IsString()
    @IsOptional()
    description?: string;
}