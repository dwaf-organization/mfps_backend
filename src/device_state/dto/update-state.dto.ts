import { Type } from "class-transformer";
import { IsDate, IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UpdateStateDto {
    @IsInt()
    @Type(() => Number)
    @IsNotEmpty()
    device_code: number;

    @IsInt()
    @Type(() => Number)
    @IsOptional()
    is_active?: number;

    @IsDate()
    @Type(() => Date)
    @IsOptional()
    last_seen_at?: Date;

    @IsString()
    @IsOptional()
    note?: string;

    @IsString()
    @IsOptional()
    description?: string;
}