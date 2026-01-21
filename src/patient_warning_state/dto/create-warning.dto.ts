import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateWarningDto {
    @IsInt()
    @Type(() => Number)
    @IsNotEmpty()
    patient_code: number;

    @IsInt()
    @Type(() => Number)
    @IsOptional()
    warning_state?: number;

    @IsString()
    @IsOptional()
    description?: string;
}